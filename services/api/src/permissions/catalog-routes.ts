import { Hono } from "hono";

import type { AppEnv } from "../app-env";
import { currentPrincipal } from "../auth/route-helpers";
import { requireAuth } from "../auth/session";
import {
  directPermissionGrantsForUser,
  effectivePermissionsForUser,
  roleIdsForUser,
} from "./access";
import { requirePermission } from "./guards";
import { permissionCodes } from "./permission-codes";

export const permissionCatalogRoutes = new Hono<AppEnv>();

permissionCatalogRoutes.get("/me", requireAuth, async (c) => {
  const principal = currentPrincipal(c);
  const [roleIds, directGrants, effectivePermissions] = await Promise.all([
    roleIdsForUser(c.env.DB, principal.userId),
    directPermissionGrantsForUser(c.env.DB, principal.userId),
    effectivePermissionsForUser(c.env.DB, principal.userId),
  ]);

  const roleRows = roleIds.length
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
    roles: roleRows.results.map((row) => ({
      id: row.id,
      name: row.name,
      system: row.is_system === 1,
    })),
    directGrants,
    effectivePermissions,
    requestId: c.get("requestId"),
  });
});

permissionCatalogRoutes.get(
  "/catalog",
  requirePermission(permissionCodes.permissionsRead),
  async (c) => {
    const rows = await c.env.DB.prepare(
      `SELECT code, description
       FROM permissions
       ORDER BY code`,
    ).all<{ code: string; description: string }>();

    return c.json({
      permissions: rows.results,
      requestId: c.get("requestId"),
    });
  },
);
