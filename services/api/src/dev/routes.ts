import { Hono } from "hono";

import type { AppEnv } from "../app-env";
import { hashPassword, PASSWORD_ALGORITHM } from "../auth/crypto";
import { ApiError } from "../http/api-error";

const DEMO_INSTITUTION_ID = "inst_local_demo";
const DEMO_USER_ID = "usr_local_admin";
const DEMO_ROLE_ID = "role_local_admin";
const DEMO_PASSWORD = "BoardOpsLocal#2026";

function assertLocalDevelopment(url: string, environment: string): void {
  const hostname = new URL(url).hostname;
  const local =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (environment !== "development" || !local) {
    throw new ApiError(404, "NOT_FOUND", "Route not found.");
  }
}

export const devRoutes = new Hono<AppEnv>();

devRoutes.post("/bootstrap", async (c) => {
  assertLocalDevelopment(c.req.url, c.env.BOARDOPS_ENV);
  const now = Date.now();
  const correlationId = c.get("requestId");
  const credential = await hashPassword(DEMO_PASSWORD);
  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE id = ?")
    .bind(DEMO_USER_ID)
    .first<{ id: string }>();

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(
      `INSERT INTO institutions
         (id, slug, display_name, created_at_ms, updated_at_ms, institution_user_id_label)
         VALUES (?, 'demo', 'BoardOps Demo Institution', ?, ?, 'Institution User ID')
         ON CONFLICT(id) DO UPDATE SET
           slug = excluded.slug,
           display_name = excluded.display_name,
           updated_at_ms = excluded.updated_at_ms`,
    ).bind(DEMO_INSTITUTION_ID, now, now),
    c.env.DB.prepare(
      `INSERT INTO users
         (id, institution_id, institution_user_id, email, email_normalized,
          display_name, account_state, email_verified_at_ms, approved_at_ms,
          created_at_ms, updated_at_ms)
         VALUES (?, ?, 'ADMIN-001', 'admin@boardops.local', 'admin@boardops.local',
                 'Local Administrator', 'ACTIVE', ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           account_state = 'ACTIVE', email_verified_at_ms = excluded.email_verified_at_ms,
           approved_at_ms = excluded.approved_at_ms, updated_at_ms = excluded.updated_at_ms,
           version = users.version + 1`,
    ).bind(DEMO_USER_ID, DEMO_INSTITUTION_ID, now, now, now, now),
    c.env.DB.prepare(
      `INSERT INTO password_credentials
         (user_id, algorithm, password_hash, password_salt, password_iterations,
          password_changed_at_ms, updated_at_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           algorithm = excluded.algorithm,
           password_hash = excluded.password_hash,
           password_salt = excluded.password_salt,
           password_iterations = excluded.password_iterations,
           failed_login_count = 0,
           locked_until_ms = NULL,
           password_changed_at_ms = excluded.password_changed_at_ms,
           updated_at_ms = excluded.updated_at_ms`,
    ).bind(
      DEMO_USER_ID,
      PASSWORD_ALGORITHM,
      credential.hash,
      credential.salt,
      credential.iterations,
      now,
      now,
    ),
    c.env.DB.prepare(
      `INSERT INTO roles(id, institution_id, name, is_system, created_at_ms, updated_at_ms)
         VALUES (?, ?, 'Administrator', 1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET updated_at_ms = excluded.updated_at_ms`,
    ).bind(DEMO_ROLE_ID, DEMO_INSTITUTION_ID, now, now),
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO role_permissions(role_id, permission_code, created_at_ms)
         SELECT ?, code, ? FROM permissions`,
    ).bind(DEMO_ROLE_ID, now),
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO user_roles(user_id, role_id, created_at_ms)
         VALUES (?, ?, ?)`,
    ).bind(DEMO_USER_ID, DEMO_ROLE_ID, now),
    c.env.DB.prepare(
      `INSERT INTO audit_events
         (id, institution_id, actor_ref, action, entity_type, entity_id,
          metadata_json, correlation_id, created_at_ms)
         VALUES (?, ?, ?, 'dev.bootstrap.completed', 'user', ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      DEMO_INSTITUTION_ID,
      DEMO_USER_ID,
      DEMO_USER_ID,
      JSON.stringify({ localOnly: true }),
      correlationId,
      now,
    ),
  ];

  if (!existing) {
    statements.push(
      c.env.DB.prepare(
        `INSERT INTO account_state_events
           (id, institution_id, user_id, from_state, to_state, actor_user_id,
            correlation_id, created_at_ms)
           VALUES (?, ?, ?, NULL, 'ACTIVE', ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        DEMO_INSTITUTION_ID,
        DEMO_USER_ID,
        DEMO_USER_ID,
        correlationId,
        now,
      ),
    );
  }

  await c.env.DB.batch(statements);

  return c.json({
    status: "ready",
    institutionSlug: "demo",
    identifier: "admin@boardops.local",
    password: DEMO_PASSWORD,
    userId: DEMO_USER_ID,
    requestId: correlationId,
  });
});
