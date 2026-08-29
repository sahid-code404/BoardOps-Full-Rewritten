export type PermissionEffect = "ALLOW" | "DENY";

export interface DirectPermissionGrant {
  code: string;
  effect: PermissionEffect;
}

interface PermissionRow {
  code: string;
}

interface GrantRow {
  permission_code: string;
  effect: PermissionEffect;
}

export function resolveEffectivePermissions(
  rolePermissions: Iterable<string>,
  directGrants: Iterable<DirectPermissionGrant>,
): string[] {
  const effective = new Set(rolePermissions);
  const denied = new Set<string>();

  for (const grant of directGrants) {
    if (grant.effect === "DENY") {
      denied.add(grant.code);
      effective.delete(grant.code);
    } else if (!denied.has(grant.code)) {
      effective.add(grant.code);
    }
  }

  for (const code of denied) effective.delete(code);
  return [...effective].sort();
}

export async function directPermissionGrantsForUser(
  db: D1Database,
  userId: string,
): Promise<DirectPermissionGrant[]> {
  const rows = await db
    .prepare(
      `SELECT permission_code, effect
       FROM user_permission_grants
       WHERE user_id = ?
       ORDER BY permission_code`,
    )
    .bind(userId)
    .all<GrantRow>();

  return rows.results.map((row) => ({
    code: row.permission_code,
    effect: row.effect,
  }));
}

export async function rolePermissionCodesForRoleIds(
  db: D1Database,
  roleIds: readonly string[],
): Promise<string[]> {
  if (roleIds.length === 0) return [];
  const placeholders = roleIds.map(() => "?").join(", ");
  const rows = await db
    .prepare(
      `SELECT DISTINCT permission_code AS code
       FROM role_permissions
       WHERE role_id IN (${placeholders})
       ORDER BY permission_code`,
    )
    .bind(...roleIds)
    .all<PermissionRow>();
  return rows.results.map((row) => row.code);
}

export async function roleIdsForUser(
  db: D1Database,
  userId: string,
): Promise<string[]> {
  const rows = await db
    .prepare(
      `SELECT role_id AS code
       FROM user_roles
       WHERE user_id = ?
       ORDER BY role_id`,
    )
    .bind(userId)
    .all<PermissionRow>();
  return rows.results.map((row) => row.code);
}

export async function effectivePermissionsForUser(
  db: D1Database,
  userId: string,
): Promise<string[]> {
  const roleIds = await roleIdsForUser(db, userId);
  const [rolePermissions, grants] = await Promise.all([
    rolePermissionCodesForRoleIds(db, roleIds),
    directPermissionGrantsForUser(db, userId),
  ]);
  return resolveEffectivePermissions(rolePermissions, grants);
}
