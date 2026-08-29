import { Hono } from "hono";

import type { AppEnv } from "../app-env";
import { ApiError } from "../http/api-error";
import {
  hashPassword,
  normalizeEmail,
  PASSWORD_ALGORITHM,
  randomToken,
  sha256Text,
} from "./crypto";
import {
  auditStatement,
  institutionBySlug,
  isLocalDevelopmentRequest,
  outboxStatement,
  readJson,
  stateEventStatement,
} from "./route-helpers";
import type { AccountState } from "./types";
import { emailString, passwordString, requiredString } from "./validation";

interface VerificationRow {
  id: string;
  user_id: string;
  institution_id: string;
  account_state: AccountState;
  expires_at_ms: number;
  consumed_at_ms: number | null;
}

export const registrationRoutes = new Hono<AppEnv>();

registrationRoutes.post("/register", async (c) => {
  const body = await readJson(c);
  const institutionSlug = requiredString(
    body,
    "institutionSlug",
    2,
    80,
  ).toLowerCase();
  const institutionUserId = requiredString(body, "institutionUserId", 2, 80);
  const displayName = requiredString(body, "displayName", 2, 120);
  const email = emailString(body);
  const emailNormalized = normalizeEmail(email);
  const password = passwordString(body);
  const institution = await institutionBySlug(c.env.DB, institutionSlug);
  if (!institution) {
    throw new ApiError(404, "INSTITUTION_NOT_FOUND", "Institution not found.");
  }

  const duplicate = await c.env.DB.prepare(
    `SELECT id FROM users
       WHERE institution_id = ? AND (institution_user_id = ? OR email_normalized = ?)
       LIMIT 1`,
  )
    .bind(institution.id, institutionUserId, emailNormalized)
    .first<{ id: string }>();
  if (duplicate) {
    throw new ApiError(
      409,
      "REGISTRATION_ALREADY_EXISTS",
      "An account already exists for that institution identity or email.",
    );
  }

  const now = Date.now();
  const userId = crypto.randomUUID();
  const verificationId = crypto.randomUUID();
  const verificationToken = randomToken(32);
  const verificationHash = await sha256Text(verificationToken);
  const credential = await hashPassword(password);
  const correlationId = c.get("requestId");

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO users
         (id, institution_id, institution_user_id, email, email_normalized,
          display_name, account_state, created_at_ms, updated_at_ms)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING_EMAIL_VERIFICATION', ?, ?)`,
    ).bind(
      userId,
      institution.id,
      institutionUserId,
      email,
      emailNormalized,
      displayName,
      now,
      now,
    ),
    c.env.DB.prepare(
      `INSERT INTO password_credentials
         (user_id, algorithm, password_hash, password_salt, password_iterations,
          password_changed_at_ms, updated_at_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      userId,
      PASSWORD_ALGORITHM,
      credential.hash,
      credential.salt,
      credential.iterations,
      now,
      now,
    ),
    c.env.DB.prepare(
      `INSERT INTO email_verification_tokens
         (id, user_id, token_hash, created_at_ms, expires_at_ms)
         VALUES (?, ?, ?, ?, ?)`,
    ).bind(
      verificationId,
      userId,
      verificationHash,
      now,
      now + 24 * 60 * 60 * 1000,
    ),
    stateEventStatement(c.env.DB, {
      institutionId: institution.id,
      userId,
      toState: "PENDING_EMAIL_VERIFICATION",
      correlationId,
      createdAtMs: now,
    }),
    auditStatement(c.env.DB, {
      institutionId: institution.id,
      actorRef: userId,
      action: "auth.registration.created",
      entityType: "user",
      entityId: userId,
      correlationId,
      createdAtMs: now,
    }),
    outboxStatement(c.env.DB, {
      institutionId: institution.id,
      eventType: "auth.email_verification.requested",
      aggregateType: "user",
      aggregateId: userId,
      payload: {
        userId,
        email,
        verificationToken,
        expiresAtMs: now + 24 * 60 * 60 * 1000,
      },
      correlationId,
      createdAtMs: now,
    }),
  ]);

  return c.json(
    {
      status: "verification_required",
      userId,
      institution: {
        slug: institution.slug,
        displayName: institution.display_name,
        institutionUserIdLabel: institution.institution_user_id_label,
      },
      ...(isLocalDevelopmentRequest(c)
        ? { developmentVerificationToken: verificationToken }
        : {}),
      requestId: correlationId,
    },
    201,
  );
});

registrationRoutes.post("/verify-email", async (c) => {
  const body = await readJson(c);
  const token = requiredString(body, "token", 16, 256);
  const tokenHash = await sha256Text(token);
  const now = Date.now();
  const row = await c.env.DB.prepare(
    `SELECT evt.id, evt.user_id, u.institution_id, u.account_state,
              evt.expires_at_ms, evt.consumed_at_ms
       FROM email_verification_tokens evt
       JOIN users u ON u.id = evt.user_id
       WHERE evt.token_hash = ?`,
  )
    .bind(tokenHash)
    .first<VerificationRow>();

  if (!row || row.consumed_at_ms || row.expires_at_ms <= now) {
    throw new ApiError(
      422,
      "VERIFICATION_TOKEN_INVALID",
      "The email verification token is invalid or expired.",
    );
  }
  if (row.account_state !== "PENDING_EMAIL_VERIFICATION") {
    throw new ApiError(
      409,
      "ACCOUNT_STATE_CONFLICT",
      "Email verification is not pending.",
    );
  }

  const correlationId = c.get("requestId");
  await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE email_verification_tokens SET consumed_at_ms = ? WHERE id = ?",
    ).bind(now, row.id),
    c.env.DB.prepare(
      `UPDATE users
         SET account_state = 'PENDING_REVIEW', email_verified_at_ms = ?,
             updated_at_ms = ?, version = version + 1
         WHERE id = ? AND account_state = 'PENDING_EMAIL_VERIFICATION'`,
    ).bind(now, now, row.user_id),
    stateEventStatement(c.env.DB, {
      institutionId: row.institution_id,
      userId: row.user_id,
      fromState: "PENDING_EMAIL_VERIFICATION",
      toState: "PENDING_REVIEW",
      actorUserId: row.user_id,
      correlationId,
      createdAtMs: now,
    }),
    auditStatement(c.env.DB, {
      institutionId: row.institution_id,
      actorRef: row.user_id,
      action: "auth.email.verified",
      entityType: "user",
      entityId: row.user_id,
      correlationId,
      createdAtMs: now,
    }),
  ]);

  return c.json({ status: "pending_review", requestId: correlationId });
});
