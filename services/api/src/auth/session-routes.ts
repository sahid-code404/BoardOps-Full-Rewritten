import { Hono } from "hono";

import type { AppEnv } from "../app-env";
import { ApiError } from "../http/api-error";
import { normalizeEmail, sha256Text, verifyPassword } from "./crypto";
import {
  assertLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
} from "./rate-limit";
import {
  auditStatement,
  currentPrincipal,
  readJson,
} from "./route-helpers";
import {
  clearSessionCookie,
  createSession,
  requireAuth,
} from "./session";
import type { AuthUserRow } from "./types";
import {
  clientType,
  optionalString,
  passwordString,
  requiredString,
} from "./validation";

export const sessionRoutes = new Hono<AppEnv>();

sessionRoutes.post("/login", async (c) => {
  const body = await readJson(c);
  const institutionSlug = requiredString(
    body,
    "institutionSlug",
    2,
    80,
  ).toLowerCase();
  const identifier = requiredString(body, "identifier", 2, 254);
  const password = passwordString(body);
  const requestedClientType = clientType(body);
  const deviceName = optionalString(body, "deviceName", 120);
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for") ??
    "local";
  const throttleKey = await sha256Text(
    `${institutionSlug}:${identifier.trim().toLowerCase()}:${ip}`,
  );
  await assertLoginAllowed(c.env.DB, throttleKey);

  const user = await c.env.DB
    .prepare(
      `SELECT
         u.id,
         u.institution_id,
         i.slug AS institution_slug,
         u.institution_user_id,
         u.email,
         u.email_normalized,
         u.display_name,
         u.account_state,
         pc.password_hash,
         pc.password_salt,
         pc.password_iterations,
         pc.locked_until_ms
       FROM users u
       JOIN institutions i ON i.id = u.institution_id
       JOIN password_credentials pc ON pc.user_id = u.id
       WHERE i.slug = ?
         AND (u.email_normalized = ? OR u.institution_user_id = ?)
       LIMIT 1`,
    )
    .bind(institutionSlug, normalizeEmail(identifier), identifier.trim())
    .first<AuthUserRow>();

  const passwordValid = user
    ? await verifyPassword(
        password,
        user.password_hash,
        user.password_salt,
        user.password_iterations,
      )
    : false;

  if (!user || !passwordValid) {
    await recordLoginFailure(c.env.DB, throttleKey);
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid sign-in credentials.",
    );
  }
  if (user.locked_until_ms && user.locked_until_ms > Date.now()) {
    throw new ApiError(
      429,
      "ACCOUNT_TEMPORARILY_LOCKED",
      "Try again later.",
    );
  }
  if (user.account_state === "ARCHIVED") {
    throw new ApiError(403, "ACCOUNT_ARCHIVED", "This account is archived.");
  }

  await clearLoginFailures(c.env.DB, throttleKey);
  const session = await createSession(
    c,
    user.id,
    requestedClientType,
    deviceName,
  );
  const correlationId = c.get("requestId");
  const now = Date.now();
  await c.env.DB.batch([
    c.env.DB
      .prepare(
        `UPDATE password_credentials
         SET failed_login_count = 0, locked_until_ms = NULL, updated_at_ms = ?
         WHERE user_id = ?`,
      )
      .bind(now, user.id),
    auditStatement(c.env.DB, {
      institutionId: user.institution_id,
      actorRef: user.id,
      action: "auth.login.succeeded",
      entityType: "session",
      entityId: session.sessionId,
      metadata: { clientType: requestedClientType },
      correlationId,
      createdAtMs: now,
    }),
  ]);

  return c.json({
    status: "authenticated",
    accountState: user.account_state,
    session: {
      id: session.sessionId,
      expiresAtMs: session.expiresAtMs,
      stepUpVerifiedAtMs: null,
      ...(requestedClientType === "MOBILE" ? { token: session.rawToken } : {}),
    },
    user: {
      id: user.id,
      institutionUserId: user.institution_user_id,
      displayName: user.display_name,
      email: user.email,
    },
    requestId: correlationId,
  });
});

sessionRoutes.get("/me", requireAuth, (c) => {
  const principal = currentPrincipal(c);
  return c.json({
    user: {
      id: principal.userId,
      institutionId: principal.institutionId,
      institutionSlug: principal.institutionSlug,
      institutionUserId: principal.institutionUserId,
      email: principal.email,
      displayName: principal.displayName,
      accountState: principal.accountState,
      permissions: principal.permissions,
    },
    session: {
      id: principal.sessionId,
      clientType: principal.clientType,
      stepUpVerifiedAtMs: principal.stepUpVerifiedAtMs,
    },
    requestId: c.get("requestId"),
  });
});

sessionRoutes.post("/logout", requireAuth, async (c) => {
  const principal = currentPrincipal(c);
  const now = Date.now();
  await c.env.DB
    .prepare(
      `UPDATE sessions SET revoked_at_ms = ?, revoked_reason = 'USER_LOGOUT'
       WHERE id = ? AND revoked_at_ms IS NULL`,
    )
    .bind(now, principal.sessionId)
    .run();
  clearSessionCookie(c);
  return c.json({ status: "signed_out", requestId: c.get("requestId") });
});

sessionRoutes.get("/sessions", requireAuth, async (c) => {
  const principal = currentPrincipal(c);
  const rows = await c.env.DB
    .prepare(
      `SELECT id, client_type, device_name, user_agent, created_at_ms,
              last_seen_at_ms, expires_at_ms, revoked_at_ms, step_up_verified_at_ms
       FROM sessions
       WHERE user_id = ?
       ORDER BY created_at_ms DESC
       LIMIT 50`,
    )
    .bind(principal.userId)
    .all();
  return c.json({ sessions: rows.results, requestId: c.get("requestId") });
});

sessionRoutes.delete("/sessions/:sessionId", requireAuth, async (c) => {
  const principal = currentPrincipal(c);
  const sessionId = c.req.param("sessionId");
  const now = Date.now();
  const result = await c.env.DB
    .prepare(
      `UPDATE sessions
       SET revoked_at_ms = ?, revoked_reason = 'USER_REVOKED'
       WHERE id = ? AND user_id = ? AND revoked_at_ms IS NULL`,
    )
    .bind(now, sessionId, principal.userId)
    .run();
  if (result.meta.changes === 0) {
    throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found.");
  }
  if (sessionId === principal.sessionId) clearSessionCookie(c);
  return c.json({ status: "revoked", requestId: c.get("requestId") });
});
