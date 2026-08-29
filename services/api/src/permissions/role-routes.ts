import { Hono } from "hono";

import type { AppEnv } from "../app-env";
import { auditStatement, currentPrincipal, readJson } from "../auth/route-helpers";
import { requiredString } from "../auth/validation";
import { ApiError } from "../http/api-error";
import { requirePermission, requirePermissionAndStepUp } from "./guards";
import { permissionCodes } from "./permission-codes";
import {
  assertPermissionCodesExist,
  requiredStringArray,
} from "./validation";

interface RoleRow {
  id: string;
  name: string;
  is_system: number;
  created_at_ms: number;
  updated_at_ms: number;
}

async function roleForInstitution(
  db: D1Database,
  institutionId: string,
  roleId: string,
): Promise<RoleRow> {
  const role = await db
    .prepare(
      `SELECT id, name, is_system, created_at_ms, updated_at_ms
       FROM roles
       WHERE id = ? AND institution_id = ?`,
    )
    .bind(roleId, institutionId)
    .first<RoleRow>();
  if (!role) throw new ApiError(404, "ROLE_NOT_FOUND", "Role not found.");
  return role;
}

export const roleRoutes = new Hono<AppEnv>();

roleRoutes.get(
  "/roles",
  requirePermission(permissionCodes.permissionsRead),
  async (c) => {
    const principal = currentPrincipal(c);
    const [roles, assignments] = await Promise.all([
      c.env.DB.prepare(
        `SELECT id, name, is_system, created_at_ms, updated_at_ms
         FROM roles
         WHERE institution_id = ?
         ORDER BY is_system DESC, name`,
      )
        .bind(principal.institutionId)
        .all<RoleRow>(),
      c.env.DB.prepare(
        `SELECT rp.role_id, rp.permission_code
         FROM role_permissions rp
         JOIN roles r ON r.id = rp.role_id
         WHERE r.institution_id = ?
         ORDER BY rp.role_id, rp.permission_code`,
      )
        .bind(principal.institutionId)
        .all<{ role_id: string; permission_code: string }>(),
    ]);

    const permissionsByRole = new Map<string, string[]>();
    for (const row of assignments.results) {
      const current = permissionsByRole.get(row.role_id) ?? [];
      current.push(row.permission_code);
      permissionsByRole.set(row.role_id, current);
    }

    return c.json({
      roles: roles.results.map((role) => ({
        id: role.id,
        name: role.name,
        system: role.is_system === 1,
        permissionCodes: permissionsByRole.get(role.id) ?? [],
        createdAtMs: role.created_at_ms,
        updatedAtMs: role.updated_at_ms,
      })),
      requestId: c.get("requestId"),
    });
  },
);

roleRoutes.post(
  "/roles",
  requirePermissionAndStepUp(permissionCodes.permissionsManage),
  async (c) => {
    const principal = currentPrincipal(c);
    const body = await readJson(c);
    const name = requiredString(body, "name", 2, 80);
    const rolePermissionCodes = requiredStringArray(body, "permissionCodes", 100);
    await assertPermissionCodesExist(c.env.DB, rolePermissionCodes);

    const duplicate = await c.env.DB.prepare(
      `SELECT id FROM roles WHERE institution_id = ? AND name = ?`,
    )
      .bind(principal.institutionId, name)
      .first<{ id: string }>();
    if (duplicate) {
      throw new ApiError(409, "ROLE_NAME_EXISTS", "A role with this name already exists.");
    }

    const roleId = crypto.randomUUID();
    const now = Date.now();
    const correlationId = c.get("requestId");
    const statements: D1PreparedStatement[] = [
      c.env.DB.prepare(
        `INSERT INTO roles
         (id, institution_id, name, is_system, created_at_ms, updated_at_ms)
         VALUES (?, ?, ?, 0, ?, ?)`,
      ).bind(roleId, principal.institutionId, name, now, now),
      auditStatement(c.env.DB, {
        institutionId: principal.institutionId,
        actorRef: principal.userId,
        action: "permissions.role.created",
        entityType: "role",
        entityId: roleId,
        metadata: { name, permissionCodes: rolePermissionCodes },
        correlationId,
        createdAtMs: now,
      }),
    ];
    for (const code of rolePermissionCodes) {
      statements.splice(
        statements.length - 1,
        0,
        c.env.DB.prepare(
          `INSERT INTO role_permissions(role_id, permission_code, created_at_ms)
           VALUES (?, ?, ?)`,
        ).bind(roleId, code, now),
      );
    }
    await c.env.DB.batch(statements);

    return c.json({
      role: {
        id: roleId,
        name,
        system: false,
        permissionCodes: rolePermissionCodes.sort(),
      },
      requestId: correlationId,
    }, 201);
  },
);

roleRoutes.put(
  "/roles/:roleId",
  requirePermissionAndStepUp(permissionCodes.permissionsManage),
  async (c) => {
    const principal = currentPrincipal(c);
    const roleId = c.req.param("roleId");
    const existing = await roleForInstitution(c.env.DB, principal.institutionId, roleId);
    if (existing.is_system === 1) {
      throw new ApiError(
        409,
        "SYSTEM_ROLE_IMMUTABLE",
        "System roles cannot be modified through this endpoint.",
      );
    }

    const body = await readJson(c);
    const name = requiredString(body, "name", 2, 80);
    const rolePermissionCodes = requiredStringArray(body, "permissionCodes", 100);
    await assertPermissionCodesExist(c.env.DB, rolePermissionCodes);

    const duplicate = await c.env.DB.prepare(
      `SELECT id FROM roles WHERE institution_id = ? AND name = ? AND id <> ?`,
    )
      .bind(principal.institutionId, name, roleId)
      .first<{ id: string }>();
    if (duplicate) {
      throw new ApiError(409, "ROLE_NAME_EXISTS", "A role with this name already exists.");
    }

    const now = Date.now();
    const correlationId = c.get("requestId");
    const statements: D1PreparedStatement[] = [
      c.env.DB.prepare(
        `UPDATE roles SET name = ?, updated_at_ms = ?
         WHERE id = ? AND institution_id = ?`,
      ).bind(name, now, roleId, principal.institutionId),
      c.env.DB.prepare("DELETE FROM role_permissions WHERE role_id = ?").bind(roleId),
    ];
    for (const code of rolePermissionCodes) {
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO role_permissions(role_id, permission_code, created_at_ms)
           VALUES (?, ?, ?)`,
        ).bind(roleId, code, now),
      );
    }
    statements.push(
      auditStatement(c.env.DB, {
        institutionId: principal.institutionId,
        actorRef: principal.userId,
        action: "permissions.role.updated",
        entityType: "role",
        entityId: roleId,
        metadata: {
          previousName: existing.name,
          name,
          permissionCodes: rolePermissionCodes,
        },
        correlationId,
        createdAtMs: now,
      }),
    );
    await c.env.DB.batch(statements);

    return c.json({
      role: {
        id: roleId,
        name,
        system: false,
        permissionCodes: rolePermissionCodes.sort(),
      },
      requestId: correlationId,
    });
  },
);
