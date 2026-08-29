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
  isLocalDevelopmentRequest,
  outboxStatement,
  readJson,
} from "./route-helpers";
import { passwordString, requiredString } from "./validation";

interface ResetRow {
  id: string;
  user_id: string;
  institution_id: string;
  expires_at_ms: number;
  consumed_at_ms: number | null;
}

export const passwordResetRoutes = new Hono<AppEnv>();

passwordResetRoutes.post("/password-reset/request", async (c) => {
  const body = await readJson(c);
  const institutionSlug = requiredString(
    body,
    "institutionSlug",
    2,
    80,
  ).toLowerCase();
  const identifier = requiredString(body, "identifier", 2, 254);
  const user = await c.env.DB.prepare(
    `SELECT u.id, u.institution_id, u.email
       FROM users u
       JOIN institutions i ON i.id = u.institution_id
       WHERE i.slug = ?
         AND (u.email_normalized = ? OR u.institution_user_id = ?)
       LIMIT 1`,
  )
    .bind(institutionSlug, normalizeEmail(identifier), identifier.trim())
    .first<{ id: string; institution_id: string; email: string }>();

  let developmentResetToken: string | undefined;
  if (user) {
    const now = Date.now();
    const rawToken = randomToken(32);
    const tokenHash = await sha256Text(rawToken);
    const correlationId = c.get("requestId");
    const expiresAtMs = now + 30 * 60 * 1000;

    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO password_reset_tokens
           (id, user_id, token_hash, created_at_ms, expires_at_ms)
           VALUES (?, ?, ?, ?, ?)`,
      ).bind(crypto.randomUUID(), user.id, tokenHash, now, expiresAtMs),
      outboxStatement(c.env.DB, {
        institutionId: user.institution_id,
        eventType: "auth.password_reset.requested",
        aggregateType: "user",
        aggregateId: user.id,
        payload: {
          userId: user.id,
          email: user.email,
          resetToken: rawToken,
          expiresAtMs,
        },
        correlationId,
        createdAtMs: now,
      }),
      auditStatement(c.env.DB, {
        institutionId: user.institution_id,
        actorRef: user.id,
        action: "auth.password_reset.requested",
        entityType: "user",
        entityId: user.id,
        correlationId,
        createdAtMs: now,
      }),
    ]);

    if (isLocalDevelopmentRequest(c)) developmentResetToken = rawToken;
  }

  return c.json({
    status: "accepted",
    ...(developmentResetToken ? { developmentResetToken } : {}),
    requestId: c.get("requestId"),
  });
});

passwordResetRoutes.post("/password-reset/confirm", async (c) => {
  const body = await readJson(c);
  const token = requiredString(body, "token", 16, 256);
  const newPassword = passwordString(body, "newPassword");
  const tokenHash = await sha256Text(token);
  const now = Date.now();
  const reset = await c.env.DB.prepare(
    `SELECT prt.id, prt.user_id, u.institution_id,
              prt.expires_at_ms, prt.consumed_at_ms
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = ?`,
  )
    .bind(tokenHash)
    .first<ResetRow>();

  if (!reset || reset.consumed_at_ms || reset.expires_at_ms <= now) {
    throw new ApiError(
      422,
      "PASSWORD_RESET_TOKEN_INVALID",
      "The password reset token is invalid or expired.",
    );
  }

  const credential = await hashPassword(newPassword);
  const correlationId = c.get("requestId");
  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE password_credentials
         SET algorithm = ?, password_hash = ?, password_salt = ?,
             password_iterations = ?, failed_login_count = 0,
             locked_until_ms = NULL, password_changed_at_ms = ?, updated_at_ms = ?
         WHERE user_id = ?`,
    ).bind(
      PASSWORD_ALGORITHM,
      credential.hash,
      credential.salt,
      credential.iterations,
      now,
      now,
      reset.user_id,
    ),
    c.env.DB.prepare(
      "UPDATE password_reset_tokens SET consumed_at_ms = ? WHERE id = ?",
    ).bind(now, reset.id),
    c.env.DB.prepare(
      `UPDATE sessions
         SET revoked_at_ms = ?, revoked_reason = 'PASSWORD_RESET'
         WHERE user_id = ? AND revoked_at_ms IS NULL`,
    ).bind(now, reset.user_id),
    auditStatement(c.env.DB, {
      institutionId: reset.institution_id,
      actorRef: reset.user_id,
      action: "auth.password.reset",
      entityType: "user",
      entityId: reset.user_id,
      correlationId,
      createdAtMs: now,
    }),
  ]);

  return c.json({ status: "password_reset", requestId: correlationId });
});
