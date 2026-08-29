import { Hono } from "hono";

import type { AppEnv } from "../app-env";
import { ApiError } from "../http/api-error";
import {
  OTP_MAX_ATTEMPTS,
  OTP_MAX_REQUESTS_PER_WINDOW,
  OTP_PURPOSE_STEP_UP,
  OTP_REQUEST_WINDOW_MS,
  OTP_TTL_MS,
  generateNumericOtp,
  isValidOtpCode,
  otpCodeHash,
  otpCodeMatches,
} from "./otp";
import {
  auditStatement,
  currentPrincipal,
  isLocalDevelopmentRequest,
  outboxStatement,
  readJson,
} from "./route-helpers";
import { requireAuth } from "./session";
import { optionalString, requiredString } from "./validation";

interface OtpChallengeRow {
  id: string;
  user_id: string;
  purpose: string;
  code_hash: string;
  attempt_count: number;
  max_attempts: number;
  expires_at_ms: number;
  consumed_at_ms: number | null;
}

function otpPurpose(body: Record<string, unknown>): typeof OTP_PURPOSE_STEP_UP {
  const value =
    optionalString(body, "purpose", 32)?.toUpperCase() ?? OTP_PURPOSE_STEP_UP;
  if (value !== OTP_PURPOSE_STEP_UP) {
    throw new ApiError(
      422,
      "OTP_PURPOSE_UNSUPPORTED",
      "Only STEP_UP OTP challenges are supported in this API version.",
    );
  }
  return OTP_PURPOSE_STEP_UP;
}

export const otpRoutes = new Hono<AppEnv>();

otpRoutes.post("/otp/request", requireAuth, async (c) => {
  const principal = currentPrincipal(c);
  if (principal.accountState !== "ACTIVE") {
    throw new ApiError(
      403,
      "ACCOUNT_NOT_ACTIVE",
      "The account must be active before requesting a step-up code.",
    );
  }

  const body = await readJson(c);
  const purpose = otpPurpose(body);
  const now = Date.now();
  const windowStart = now - OTP_REQUEST_WINDOW_MS;
  const recent = await c.env.DB.prepare(
    `SELECT COUNT(*) AS count
       FROM otp_challenges
       WHERE user_id = ? AND purpose = ? AND created_at_ms >= ?`,
  )
    .bind(principal.userId, purpose, windowStart)
    .first<{ count: number }>();

  if ((recent?.count ?? 0) >= OTP_MAX_REQUESTS_PER_WINDOW) {
    throw new ApiError(
      429,
      "OTP_RATE_LIMITED",
      "Too many verification-code requests. Try again later.",
    );
  }

  const challengeId = crypto.randomUUID();
  const code = generateNumericOtp();
  const codeHash = await otpCodeHash(challengeId, code);
  const expiresAtMs = now + OTP_TTL_MS;
  const correlationId = c.get("requestId");

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE otp_challenges
         SET consumed_at_ms = ?
         WHERE user_id = ? AND purpose = ? AND consumed_at_ms IS NULL`,
    ).bind(now, principal.userId, purpose),
    c.env.DB.prepare(
      `INSERT INTO otp_challenges
         (id, user_id, purpose, code_hash, attempt_count, max_attempts,
          created_at_ms, expires_at_ms, consumed_at_ms)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, NULL)`,
    ).bind(
      challengeId,
      principal.userId,
      purpose,
      codeHash,
      OTP_MAX_ATTEMPTS,
      now,
      expiresAtMs,
    ),
    outboxStatement(c.env.DB, {
      institutionId: principal.institutionId,
      eventType: "auth.otp.requested",
      aggregateType: "otp_challenge",
      aggregateId: challengeId,
      payload: {
        userId: principal.userId,
        email: principal.email,
        purpose,
        otpCode: code,
        expiresAtMs,
      },
      correlationId,
      createdAtMs: now,
    }),
    auditStatement(c.env.DB, {
      institutionId: principal.institutionId,
      actorRef: principal.userId,
      action: "auth.otp.requested",
      entityType: "otp_challenge",
      entityId: challengeId,
      metadata: { purpose, expiresAtMs },
      correlationId,
      createdAtMs: now,
    }),
  ]);

  return c.json({
    status: "code_sent",
    challengeId,
    purpose,
    expiresAtMs,
    ...(isLocalDevelopmentRequest(c) ? { developmentOtpCode: code } : {}),
    requestId: correlationId,
  });
});

otpRoutes.post("/otp/verify", requireAuth, async (c) => {
  const principal = currentPrincipal(c);
  const body = await readJson(c);
  const challengeId = requiredString(body, "challengeId", 16, 80);
  const code = requiredString(body, "code", 6, 6);
  if (!isValidOtpCode(code)) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "code must contain exactly six digits.",
    );
  }

  const row = await c.env.DB.prepare(
    `SELECT id, user_id, purpose, code_hash, attempt_count, max_attempts,
              expires_at_ms, consumed_at_ms
       FROM otp_challenges
       WHERE id = ? AND user_id = ?`,
  )
    .bind(challengeId, principal.userId)
    .first<OtpChallengeRow>();

  const now = Date.now();
  if (!row) {
    throw new ApiError(422, "OTP_INVALID", "The verification code is invalid.");
  }
  if (row.consumed_at_ms !== null) {
    throw new ApiError(
      422,
      "OTP_ALREADY_USED",
      "The verification code is no longer usable.",
    );
  }
  if (row.expires_at_ms <= now) {
    await c.env.DB.prepare(
      "UPDATE otp_challenges SET consumed_at_ms = ? WHERE id = ?",
    )
      .bind(now, row.id)
      .run();
    throw new ApiError(
      422,
      "OTP_EXPIRED",
      "The verification code has expired.",
    );
  }
  if (row.attempt_count >= row.max_attempts) {
    throw new ApiError(
      429,
      "OTP_ATTEMPTS_EXHAUSTED",
      "Too many invalid verification-code attempts.",
    );
  }

  const matches = await otpCodeMatches(row.id, code, row.code_hash);
  const correlationId = c.get("requestId");
  if (!matches) {
    const nextAttemptCount = row.attempt_count + 1;
    const exhausted = nextAttemptCount >= row.max_attempts;
    await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE otp_challenges
           SET attempt_count = ?, consumed_at_ms = CASE WHEN ? THEN ? ELSE consumed_at_ms END
           WHERE id = ? AND consumed_at_ms IS NULL`,
      ).bind(nextAttemptCount, exhausted ? 1 : 0, now, row.id),
      auditStatement(c.env.DB, {
        institutionId: principal.institutionId,
        actorRef: principal.userId,
        action: "auth.otp.failed",
        entityType: "otp_challenge",
        entityId: row.id,
        metadata: { purpose: row.purpose, attemptCount: nextAttemptCount },
        correlationId,
        createdAtMs: now,
      }),
    ]);

    if (exhausted) {
      throw new ApiError(
        429,
        "OTP_ATTEMPTS_EXHAUSTED",
        "Too many invalid verification-code attempts.",
      );
    }
    throw new ApiError(422, "OTP_INVALID", "The verification code is invalid.");
  }

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE otp_challenges
         SET consumed_at_ms = ?
         WHERE id = ? AND consumed_at_ms IS NULL`,
    ).bind(now, row.id),
    c.env.DB.prepare(
      `UPDATE sessions
         SET step_up_verified_at_ms = ?
         WHERE id = ? AND user_id = ? AND revoked_at_ms IS NULL`,
    ).bind(now, principal.sessionId, principal.userId),
    auditStatement(c.env.DB, {
      institutionId: principal.institutionId,
      actorRef: principal.userId,
      action: "auth.otp.verified",
      entityType: "session",
      entityId: principal.sessionId,
      metadata: { purpose: row.purpose, challengeId: row.id },
      correlationId,
      createdAtMs: now,
    }),
  ]);

  return c.json({
    status: "verified",
    purpose: row.purpose,
    verifiedAtMs: now,
    requestId: correlationId,
  });
});
