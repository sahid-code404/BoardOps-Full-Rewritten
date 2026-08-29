import { Hono } from "hono";

import type { AppEnv } from "../app-env";
import { auditStatement, currentPrincipal, readJson } from "../auth/route-helpers";
import { requiredString } from "../auth/validation";
import type { AccountState } from "../auth/types";
import { ApiError } from "../http/api-error";
import {
  directPermissionGrantsForUser,
  effectivePermissionsForUser,
  resolveEffectivePermissions,
  roleIdsForUser,
  rolePermissionCodesForRoleIds,
  type DirectPermissionGrant,
} from "./access";
import { requirePermission, requirePermissionAndStepUp } from "./guards";
import { permissionCodes } from "./permission-codes";
import {
  assertPermissionCodesExist,
  permissionOverrideEffect,
  requiredStringArray,
} from "./validation";

interface AccessUserRow {
  id: string;
  institution_user_id: string;
  email: string;
  display_name: string;
  account_state: AccountState;
}

async function userForInstitution(
  db: D1Database,
  institutionId: string,
  userId: string,
): Promise<AccessUserRow> {
  const user = await db
    .prepare(
      `SELECT id, institution_user_id, email, display_name, account_state
       FROM users WHERE id = ? AND institution_id = ?`,
    )
    .bind(userId, institutionId)
    .first<AccessUserRow>();
  if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");
  return user;
}

async function roleIdsForInstitution(
  db: D1Database,
  institutionId: string,
  roleIds: readonly string[],
): Promise<string[]> {
  if (roleIds.length === 0) return [];
  const placeholders = roleIds.map(() => "?").join(", ");
  const rows = await db
    .prepare(
      `SELECT id FROM roles
       WHERE institution_id = ? AND id IN (${placeholders})`,
    )
    .bind(institutionId, ...roleIds)
    .all<{ id: string }>();
  return rows.results.map((row) => row.id);
}

function assertNoSelfLockout(
  actorUserId: string,
  targetUserId: string,
  effectivePermissions: readonly string[],
): void {
  if (
    actorUserId === targetUserId &&
    !effectivePermissions.includes(permissionCodes.permissionsManage)
  ) {
    throw new ApiError(
      409,
      "SELF_LOCKOUT_PREVENTED",
      "You cannot remove your own permission-management access.",
    );
  }
}

export const userAccessRoutes = new Hono<AppEnv>();

userAccessRoutes.get(
  "/users",
  requirePermission(permissionCodes.permissionsRead),
  async (c) => {
    const principal = currentPrincipal(c);
    const rows = await c.env.DB.prepare(
      `SELECT id, institution_user_id, email, display_name, account_state
       FROM users
       WHERE institution_id = ?
       ORDER BY display_name, institution_user_id
       LIMIT 200`,
    )
      .bind(principal.institutionId)
      .all<AccessUserRow>();

    return c.json({
      users: rows.results.map((user) => ({
        id: user.id,
        institutionUserId: user.institution_user_id,
        email: user.email,
        displayName: user.display_name,
        accountState: user.account_state,
      })),
      requestId: c.get("requestId"),
    });
  },
);

userAccessRoutes.get(
  "/users/:userId",
  requirePermission(permissionCodes.permissionsRead),
  async (c) => {
    const principal = currentPrincipal(c);
    const userId = c.req.param("userId");
    const user = await userForInstitution(c.env.DB, principal.institutionId, userId);
    const [roleIds, directGrants, effectivePermissions] = await Promise.all([
      roleIdsForUser(c.env.DB, userId),
      directPermissionGrantsForUser(c.env.DB, userId),
      effectivePermissionsForUser(c.env.DB, userId),
    ]);
    const roles = roleIds.length
      ? await c.env.DB.prepare(
          `SELECT id, name, is_system
           FROM roles
           WHERE institution_id = ? AND id IN (${roleIds.map(() => "?").join(", ")})
           ORDER BY is_system DESC, name`,
        )
          .bind(principal.institutionId, ...roleIds)
          .all<{ id: string; name: string; is_system: number }>()
      : { results: [] as Array<{ id: string; name: string; is_system: number }> };

    return c.json({
      user: {
        id: user.id,
        institutionUserId: user.institution_user_id,
        email: user.email,
        displayName: user.display_name,
        accountState: user.account_state,
      },
      roles: roles.results.map((role) => ({
        id: role.id,
        name: role.name,
        system: role.is_system === 1,
      })),
      directGrants,
      effectivePermissions,
      requestId: c.get("requestId"),
    });
  },
);

userAccessRoutes.put(
  "/users/:userId/roles",
  requirePermissionAndStepUp(permissionCodes.permissionsManage),
  async (c) => {
    const principal = currentPrincipal(c);
    const userId = c.req.param("userId");
    await userForInstitution(c.env.DB, principal.institutionId, userId);
    const body = await readJson(c);
    const roleIds = requiredStringArray(body, "roleIds", 40);
    const reason = requiredString(body, "reason", 3, 500);

    const validRoleIds = await roleIdsForInstitution(
      c.env.DB,
      principal.institutionId,
      roleIds,
    );
    if (validRoleIds.length !== roleIds.length) {
      throw new ApiError(
        422,
        "ROLE_SCOPE_INVALID",
        "One or more roles do not belong to this institution.",
      );
    }

    const [rolePermissions, grants] = await Promise.all([
      rolePermissionCodesForRoleIds(c.env.DB, roleIds),
      directPermissionGrantsForUser(c.env.DB, userId),
    ]);
    const nextEffectivePermissions = resolveEffectivePermissions(
      rolePermissions,
      grants,
    );
    assertNoSelfLockout(principal.userId, userId, nextEffectivePermissions);

    const now = Date.now();
    const correlationId = c.get("requestId");
    const statements: D1PreparedStatement[] = [
      c.env.DB.prepare("DELETE FROM user_roles WHERE user_id = ?").bind(userId),
    ];
    for (const roleId of roleIds) {
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO user_roles(user_id, role_id, created_at_ms)
           VALUES (?, ?, ?)`,
        ).bind(userId, roleId, now),
      );
    }
    statements.push(
      auditStatement(c.env.DB, {
        institutionId: principal.institutionId,
        actorRef: principal.userId,
        action: "permissions.user_roles.replaced",
        entityType: "user",
        entityId: userId,
        reason,
        metadata: { roleIds },
        correlationId,
        createdAtMs: now,
      }),
    );
    await c.env.DB.batch(statements);

    return c.json({
      roleIds: roleIds.sort(),
      effectivePermissions: nextEffectivePermissions,
      requestId: correlationId,
    });
  },
);

userAccessRoutes.put(
  "/users/:userId/grants/:permissionCode",
  requirePermissionAndStepUp(permissionCodes.permissionsManage),
  async (c) => {
    const principal = currentPrincipal(c);
    const userId = c.req.param("userId");
    const permissionCode = c.req.param("permissionCode");
    await userForInstitution(c.env.DB, principal.institutionId, userId);
    await assertPermissionCodesExist(c.env.DB, [permissionCode]);

    const body = await readJson(c);
    const effect = permissionOverrideEffect(body);
    const reason = requiredString(body, "reason", 3, 500);
    const [roleIds, currentGrants] = await Promise.all([
      roleIdsForUser(c.env.DB, userId),
      directPermissionGrantsForUser(c.env.DB, userId),
    ]);
    const rolePermissions = await rolePermissionCodesForRoleIds(c.env.DB, roleIds);
    const nextGrants: DirectPermissionGrant[] = currentGrants.filter(
      (grant) => grant.code !== permissionCode,
    );
    if (effect !== "INHERIT") {
      nextGrants.push({ code: permissionCode, effect });
    }
    const nextEffectivePermissions = resolveEffectivePermissions(
      rolePermissions,
      nextGrants,
    );
    assertNoSelfLockout(principal.userId, userId, nextEffectivePermissions);

    const now = Date.now();
    const correlationId = c.get("requestId");
    const mutation =
      effect === "INHERIT"
        ? c.env.DB.prepare(
            `DELETE FROM user_permission_grants
             WHERE user_id = ? AND permission_code = ?`,
          ).bind(userId, permissionCode)
        : c.env.DB.prepare(
            `INSERT INTO user_permission_grants
             (user_id, permission_code, effect, reason, created_at_ms, created_by_user_id)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(user_id, permission_code) DO UPDATE SET
               effect = excluded.effect,
               reason = excluded.reason,
               created_at_ms = excluded.created_at_ms,
               created_by_user_id = excluded.created_by_user_id`,
          ).bind(
            userId,
            permissionCode,
            effect,
            reason,
            now,
            principal.userId,
          );

    await c.env.DB.batch([
      mutation,
      auditStatement(c.env.DB, {
        institutionId: principal.institutionId,
        actorRef: principal.userId,
        action: "permissions.user_override.changed",
        entityType: "user",
        entityId: userId,
        reason,
        metadata: { permissionCode, effect },
        correlationId,
        createdAtMs: now,
      }),
    ]);

    return c.json({
      permissionCode,
      effect,
      effectivePermissions: nextEffectivePermissions,
      requestId: correlationId,
    });
  },
);
