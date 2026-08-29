import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import type { AppEnv } from "../app-env";
import { ApiError } from "../http/api-error";
import { randomToken, sha256Text } from "./crypto";
import type { AccountState, AuthPrincipal, ClientType } from "./types";

const SESSION_COOKIE = "boardops_session";
const WEB_SESSION_SECONDS = 30 * 24 * 60 * 60;
const MOBILE_SESSION_SECONDS = 60 * 24 * 60 * 60;

interface SessionRow {
  session_id: string;
  user_id: string;
  institution_id: string;
  institution_slug: string;
  institution_user_id: string;
  email: string;
  display_name: string;
  account_state: AccountState;
  client_type: ClientType;
  step_up_verified_at_ms: number | null;
}

function bearerToken(c: Context<AppEnv>): string | undefined {
  const authorization = c.req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const token = authorization.slice("Bearer ".length).trim();
  return token || undefined;
}

export function requestSessionToken(c: Context<AppEnv>): string | undefined {
  return bearerToken(c) ?? getCookie(c, SESSION_COOKIE);
}

async function permissionsForUser(
  db: D1Database,
  userId: string,
): Promise<string[]> {
  const allowed = await db
    .prepare(
      `SELECT DISTINCT permission_code AS code
       FROM (
         SELECT rp.permission_code
         FROM user_roles ur
         JOIN role_permissions rp ON rp.role_id = ur.role_id
         WHERE ur.user_id = ?
         UNION ALL
         SELECT permission_code
         FROM user_permission_grants
         WHERE user_id = ? AND effect = 'ALLOW'
       )`,
    )
    .bind(userId, userId)
    .all<{ code: string }>();

  const denied = await db
    .prepare(
      `SELECT permission_code AS code
       FROM user_permission_grants
       WHERE user_id = ? AND effect = 'DENY'`,
    )
    .bind(userId)
    .all<{ code: string }>();

  const deniedCodes = new Set(denied.results.map((row) => row.code));
  return allowed.results
    .map((row) => row.code)
    .filter((code) => !deniedCodes.has(code))
    .sort();
}

export async function resolvePrincipal(
  c: Context<AppEnv>,
): Promise<AuthPrincipal | null> {
  const token = requestSessionToken(c);
  if (!token) return null;

  const tokenHash = await sha256Text(token);
  const now = Date.now();
  const row = await c.env.DB.prepare(
    `SELECT
         s.id AS session_id,
         s.user_id,
         u.institution_id,
         i.slug AS institution_slug,
         u.institution_user_id,
         u.email,
         u.display_name,
         u.account_state,
         s.client_type,
         s.step_up_verified_at_ms
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN institutions i ON i.id = u.institution_id
       WHERE s.token_hash = ?
         AND s.revoked_at_ms IS NULL
         AND s.expires_at_ms > ?`,
  )
    .bind(tokenHash, now)
    .first<SessionRow>();

  if (!row) return null;

  await c.env.DB.prepare("UPDATE sessions SET last_seen_at_ms = ? WHERE id = ?")
    .bind(now, row.session_id)
    .run();

  return {
    sessionId: row.session_id,
    userId: row.user_id,
    institutionId: row.institution_id,
    institutionSlug: row.institution_slug,
    institutionUserId: row.institution_user_id,
    email: row.email,
    displayName: row.display_name,
    accountState: row.account_state,
    clientType: row.client_type,
    stepUpVerifiedAtMs: row.step_up_verified_at_ms,
    permissions: await permissionsForUser(c.env.DB, row.user_id),
  };
}

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const principal = await resolvePrincipal(c);
  if (!principal) {
    throw new ApiError(401, "AUTH_REQUIRED", "Authentication is required.");
  }
  c.set("auth", principal);
  await next();
};

export function requirePermission(
  permission: string,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const principal = c.get("auth") ?? (await resolvePrincipal(c));
    if (!principal) {
      throw new ApiError(401, "AUTH_REQUIRED", "Authentication is required.");
    }
    if (principal.accountState !== "ACTIVE") {
      throw new ApiError(
        403,
        "ACCOUNT_NOT_ACTIVE",
        "The account is not active for this operation.",
      );
    }
    if (!principal.permissions.includes(permission)) {
      throw new ApiError(403, "PERMISSION_DENIED", "Permission denied.");
    }
    c.set("auth", principal);
    await next();
  };
}

export async function createSession(
  c: Context<AppEnv>,
  userId: string,
  clientType: ClientType,
  deviceName?: string,
): Promise<{ sessionId: string; rawToken: string; expiresAtMs: number }> {
  const now = Date.now();
  const lifetimeSeconds =
    clientType === "MOBILE" ? MOBILE_SESSION_SECONDS : WEB_SESSION_SECONDS;
  const expiresAtMs = now + lifetimeSeconds * 1000;
  const rawToken = randomToken(32);
  const tokenHash = await sha256Text(rawToken);
  const sessionId = crypto.randomUUID();
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for") ??
    "local";
  const ipHash = await sha256Text(ip);
  const userAgent = c.req.header("user-agent")?.slice(0, 512) ?? null;

  await c.env.DB.prepare(
    `INSERT INTO sessions
       (id, user_id, token_hash, client_type, device_name, user_agent, ip_hash,
        created_at_ms, last_seen_at_ms, expires_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      sessionId,
      userId,
      tokenHash,
      clientType,
      deviceName ?? null,
      userAgent,
      ipHash,
      now,
      now,
      expiresAtMs,
    )
    .run();

  if (clientType === "WEB") {
    setCookie(c, SESSION_COOKIE, rawToken, {
      httpOnly: true,
      secure: c.env.BOARDOPS_ENV !== "development",
      sameSite: "Lax",
      path: "/",
      maxAge: lifetimeSeconds,
    });
  }

  return { sessionId, rawToken, expiresAtMs };
}

export function clearSessionCookie(c: Context<AppEnv>): void {
  deleteCookie(c, SESSION_COOKIE, {
    path: "/",
    secure: c.env.BOARDOPS_ENV !== "development",
  });
}
