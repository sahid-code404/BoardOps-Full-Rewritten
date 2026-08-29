import { Hono } from "hono";

import type { AppEnv } from "../app-env";
import { ApiError } from "../http/api-error";
import {
  hashPassword,
  normalizeEmail,
  PASSWORD_ALGORITHM,
  randomToken,
  sha256Text,
  verifyPassword,
} from "./crypto";
import {
  assertLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
} from "./rate-limit";
import {
  clearSessionCookie,
  createSession,
  requireAuth,
  requirePermission,
} from "./session";
import type { AccountState, AuthUserRow } from "./types";
import {
  clientType,
  emailString,
  objectBody,
  optionalString,
  passwordString,
  requiredString,
  reviewAction,
} from "./validation";

interface InstitutionRow {
  id: string;
  slug: string;
  display_name: string;
  institution_user_id_label: string;
}

interface VerificationRow {
  id: string;
  user_id: string;
  institution_id: string;
  account_state: AccountState;
  expires_at_ms: number;
  consumed_at_ms: number | null;
}

interface ResetRow {
  id: string;
  user_id: string;
  institution_id: string;
  expires_at_ms: number;
  consumed_at_ms: number | null;
}

async function readJson(c: Parameters<typeof objectBody>[0] extends never ? never : any) {
  try {
    return objectBody(await c.req.json<unknown>());
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(422, "VALIDATION_ERROR", "Request body must contain valid JSON.");
  }
}

function isLocalDevelopmentRequest(c: any): boolean {
  if (c.env.BOARDOPS_ENV !== "development") return false;
  const hostname = new URL(c.req.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function institutionBySlug(
  db: D1Database,
  slug: string,
): Promise<InstitutionRow | null> {
  return db
    .prepare(
      `SELECT id, slug, display_name, institution_user_id_label
       FROM institutions WHERE slug = ?`,
    )
    .bind(slug.toLowerCase())
    .first<InstitutionRow>();
}

async function stateEventStatement(
  db: D1Database,
  input: {
    institutionId: string;
    userId: string;
    fromState?: AccountState;
    toState: AccountState;
    reason?: string;
    actorUserId?: string;
    correlationId: string;
    createdAtMs: number;
  },
): Promise<D1PreparedStatement> {
  return db
    .prepare(
      `INSERT INTO account_state_events
       (id, institution_id, user_id, from_state, to_state, reason,
        actor_user_id, correlation_id, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      input.institutionId,
      input.userId,
      input.fromState ?? null,
      input.toState,
      input.reason ?? null,
      input.actorUserId ?? null,
      input.correlationId,
      input.createdAtMs,
    );
}

function auditStatement(
  db: D1Database,
  input: {
    institutionId?: string;
    actorRef?: string;
    action: string;
    entityType: string;
    entityId?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
    correlationId: string;
    createdAtMs: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO audit_events
       (id, institution_id, actor_ref, action, entity_type, entity_id, reason,
        metadata_json, correlation_id, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      input.institutionId ?? null,
      input.actorRef ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.reason ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      input.correlationId,
      input.createdAtMs,
    );
}

function outboxStatement(
  db: D1Database,
  input: {
    institutionId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    correlationId: string;
    createdAtMs: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO outbox_events
       (id, institution_id, event_type, aggregate_type, aggregate_id,
        payload_json, correlation_id, state, attempt_count, available_at_ms, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      input.institutionId,
      input.eventType,
      input.aggregateType,
      input.aggregateId,
      JSON.stringify(input.payload),
      input.correlationId,
      input.createdAtMs,
      input.createdAtMs,
    );
}

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", async (c) => {
  const body = await readJson(c);
  const institutionSlug = requiredString(body, "institutionSlug", 2, 80).toLowerCase();
  const institutionUserId = requiredString(body, "institutionUserId", 2, 80);
  const displayName = requiredString(body, "displayName", 2, 120);
  const email = emailString(body);
  const emailNormalized = normalizeEmail(email);
  const password = passwordString(body);
  const institution = await institutionBySlug(c.env.DB, institutionSlug);
  if (!institution) {
    throw new ApiError(404, "INSTITUTION_NOT_FOUND", "Institution not found.");
  }

  const duplicate = await c.env.DB
    .prepare(
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
    c.env.DB
      .prepare(
        `INSERT INTO users
         (id, institution_id, institution_user_id, email, email_normalized,
          display_name, account_state, created_at_ms, updated_at_ms)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING_EMAIL_VERIFICATION', ?, ?)`,
      )
      .bind(
        userId,
        institution.id,
        institutionUserId,
        email,
        emailNormalized,
        displayName,
        now,
        now,
      ),
    c.env.DB
      .prepare(
        `INSERT INTO password_credentials
         (user_id, algorithm, password_hash, password_salt, password_iterations,
          password_changed_at_ms, updated_at_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        userId,
        PASSWORD_ALGORITHM,
        credential.hash,
        credential.salt,
        credential.iterations,
        now,
        now,
      ),
    c.env.DB
      .prepare(
        `INSERT INTO email_verification_tokens
         (id, user_id, token_hash, created_at_ms, expires_at_ms)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        verificationId,
        userId,
        verificationHash,
        now,
        now + 24 * 60 * 60 * 1000,
      ),
    await stateEventStatement(c.env.DB, {
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

authRoutes.post("/verify-email", async (c) => {
  const body = await readJson(c);
  const token = requiredString(body, "token", 16, 256);
  const tokenHash = await sha256Text(token);
  const now = Date.now();
  const row = await c.env.DB
    .prepare(
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
    throw new ApiError(409, "ACCOUNT_STATE_CONFLICT", "Email verification is not pending.");
  }

  const correlationId = c.get("requestId");
  await c.env.DB.batch([
    c.env.DB
      .prepare("UPDATE email_verification_tokens SET consumed_at_ms = ? WHERE id = ?")
      .bind(now, row.id),
    c.env.DB
      .prepare(
        `UPDATE users
         SET account_state = 'PENDING_REVIEW', email_verified_at_ms = ?,
             updated_at_ms = ?, version = version + 1
         WHERE id = ? AND account_state = 'PENDING_EMAIL_VERIFICATION'`,
      )
      .bind(now, now, row.user_id),
    await stateEventStatement(c.env.DB, {
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

authRoutes.post("/login", async (c) => {
  const body = await readJson(c);
  const institutionSlug = requiredString(body, "institutionSlug", 2, 80).toLowerCase();
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
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid sign-in credentials.");
  }
  if (user.locked_until_ms && user.locked_until_ms > Date.now()) {
    throw new ApiError(429, "ACCOUNT_TEMPORARILY_LOCKED", "Try again later.");
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

authRoutes.get("/me", requireAuth, async (c) => {
  const principal = c.get("auth");
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
    },
    requestId: c.get("requestId"),
  });
});

authRoutes.post("/logout", requireAuth, async (c) => {
  const principal = c.get("auth");
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

authRoutes.get("/sessions", requireAuth, async (c) => {
  const principal = c.get("auth");
  const rows = await c.env.DB
    .prepare(
      `SELECT id, client_type, device_name, user_agent, created_at_ms,
              last_seen_at_ms, expires_at_ms, revoked_at_ms
       FROM sessions
       WHERE user_id = ?
       ORDER BY created_at_ms DESC
       LIMIT 50`,
    )
    .bind(principal.userId)
    .all();
  return c.json({ sessions: rows.results, requestId: c.get("requestId") });
});

authRoutes.delete("/sessions/:sessionId", requireAuth, async (c) => {
  const principal = c.get("auth");
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

authRoutes.post("/password-reset/request", async (c) => {
  const body = await readJson(c);
  const institutionSlug = requiredString(body, "institutionSlug", 2, 80).toLowerCase();
  const identifier = requiredString(body, "identifier", 2, 254);
  const user = await c.env.DB
    .prepare(
      `SELECT u.id, u.institution_id, u.email
       FROM users u JOIN institutions i ON i.id = u.institution_id
       WHERE i.slug = ? AND (u.email_normalized = ? OR u.institution_user_id = ?)
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
    await c.env.DB.batch([
      c.env.DB
        .prepare(
          `INSERT INTO password_reset_tokens
           (id, user_id, token_hash, created_at_ms, expires_at_ms)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          user.id,
          tokenHash,
          now,
          now + 30 * 60 * 1000,
        ),
      outboxStatement(c.env.DB, {
        institutionId: user.institution_id,
        eventType: "auth.password_reset.requested",
        aggregateType: "user",
        aggregateId: user.id,
        payload: {
          userId: user.id,
          email: user.email,
          resetToken: rawToken,
          expiresAtMs: now + 30 * 60 * 1000,
        },
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

authRoutes.post("/password-reset/confirm", async (c) => {
  const body = await readJson(c);
  const token = requiredString(body, "token", 16, 256);
  const newPassword = passwordString(body, "newPassword");
  const tokenHash = await sha256Text(token);
  const now = Date.now();
  const reset = await c.env.DB
    .prepare(
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
    c.env.DB
      .prepare(
        `UPDATE password_credentials
         SET algorithm = ?, password_hash = ?, password_salt = ?,
             password_iterations = ?, failed_login_count = 0,
             locked_until_ms = NULL, password_changed_at_ms = ?, updated_at_ms = ?
         WHERE user_id = ?`,
      )
      .bind(
        PASSWORD_ALGORITHM,
        credential.hash,
        credential.salt,
        credential.iterations,
        now,
        now,
        reset.user_id,
      ),
    c.env.DB
      .prepare("UPDATE password_reset_tokens SET consumed_at_ms = ? WHERE id = ?")
      .bind(now, reset.id),
    c.env.DB
      .prepare(
        `UPDATE sessions
         SET revoked_at_ms = ?, revoked_reason = 'PASSWORD_RESET'
         WHERE user_id = ? AND revoked_at_ms IS NULL`,
      )
      .bind(now, reset.user_id),
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

authRoutes.get(
  "/registrations",
  requirePermission("resident.approve"),
  async (c) => {
    const principal = c.get("auth");
    const rows = await c.env.DB
      .prepare(
        `SELECT id, institution_user_id, email, display_name, account_state,
                email_verified_at_ms, created_at_ms, updated_at_ms
         FROM users
         WHERE institution_id = ?
           AND account_state IN ('PENDING_REVIEW', 'CHANGES_REQUESTED')
         ORDER BY created_at_ms ASC
         LIMIT 100`,
      )
      .bind(principal.institutionId)
      .all();
    return c.json({ registrations: rows.results, requestId: c.get("requestId") });
  },
);

authRoutes.post(
  "/registrations/:userId/review",
  requirePermission("resident.approve"),
  async (c) => {
    const principal = c.get("auth");
    const body = await readJson(c);
    const action = reviewAction(body);
    const reason = optionalString(body, "reason", 500);
    if (action !== "APPROVE" && !reason) {
      throw new ApiError(
        422,
        "REASON_REQUIRED",
        "A reason is required when rejecting or requesting changes.",
      );
    }
    const userId = c.req.param("userId");
    const target = await c.env.DB
      .prepare(
        `SELECT id, institution_id, account_state
         FROM users WHERE id = ? AND institution_id = ?`,
      )
      .bind(userId, principal.institutionId)
      .first<{ id: string; institution_id: string; account_state: AccountState }>();
    if (!target) throw new ApiError(404, "REGISTRATION_NOT_FOUND", "Registration not found.");
    if (target.account_state !== "PENDING_REVIEW") {
      throw new ApiError(
        409,
        "ACCOUNT_STATE_CONFLICT",
        "Only registrations pending review can be reviewed.",
      );
    }

    const now = Date.now();
    const correlationId = c.get("requestId");
    if (action === "APPROVE") {
      await c.env.DB.batch([
        c.env.DB
          .prepare(
            `UPDATE users
             SET account_state = 'ACTIVE', approved_at_ms = ?, approved_by_user_id = ?,
                 updated_at_ms = ?, version = version + 1
             WHERE id = ? AND account_state = 'PENDING_REVIEW'`,
          )
          .bind(now, principal.userId, now, userId),
        await stateEventStatement(c.env.DB, {
          institutionId: target.institution_id,
          userId,
          fromState: "PENDING_REVIEW",
          toState: "APPROVED",
          actorUserId: principal.userId,
          correlationId,
          createdAtMs: now,
        }),
        await stateEventStatement(c.env.DB, {
          institutionId: target.institution_id,
          userId,
          fromState: "APPROVED",
          toState: "ACTIVE",
          actorUserId: principal.userId,
          correlationId,
          createdAtMs: now,
        }),
        auditStatement(c.env.DB, {
          institutionId: target.institution_id,
          actorRef: principal.userId,
          action: "auth.registration.approved",
          entityType: "user",
          entityId: userId,
          correlationId,
          createdAtMs: now,
        }),
      ]);
      return c.json({ status: "active", requestId: correlationId });
    }

    const nextState: AccountState =
      action === "REQUEST_CHANGES" ? "CHANGES_REQUESTED" : "REJECTED";
    await c.env.DB.batch([
      c.env.DB
        .prepare(
          `UPDATE users
           SET account_state = ?, updated_at_ms = ?, version = version + 1
           WHERE id = ? AND account_state = 'PENDING_REVIEW'`,
        )
        .bind(nextState, now, userId),
      await stateEventStatement(c.env.DB, {
        institutionId: target.institution_id,
        userId,
        fromState: "PENDING_REVIEW",
        toState: nextState,
        reason,
        actorUserId: principal.userId,
        correlationId,
        createdAtMs: now,
      }),
      auditStatement(c.env.DB, {
        institutionId: target.institution_id,
        actorRef: principal.userId,
        action:
          action === "REQUEST_CHANGES"
            ? "auth.registration.changes_requested"
            : "auth.registration.rejected",
        entityType: "user",
        entityId: userId,
        reason,
        correlationId,
        createdAtMs: now,
      }),
    ]);
    return c.json({ status: nextState.toLowerCase(), requestId: correlationId });
  },
);
