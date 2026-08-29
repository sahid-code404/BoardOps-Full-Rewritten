import { apiRequest } from "../auth/api";

export interface PermissionCatalogEntry {
  code: string;
  description: string;
}

export interface PermissionRole {
  id: string;
  name: string;
  system: boolean;
  permissionCodes: string[];
  createdAtMs?: number;
  updatedAtMs?: number;
}

export interface AccessUser {
  id: string;
  institutionUserId: string;
  email: string;
  displayName: string;
  accountState: string;
}

export interface DirectGrant {
  code: string;
  effect: "ALLOW" | "DENY";
}

export interface UserAccessResponse {
  user: AccessUser;
  roles: Array<Pick<PermissionRole, "id" | "name" | "system">>;
  directGrants: DirectGrant[];
  effectivePermissions: string[];
}

export const permissionApi = {
  catalog: () =>
    apiRequest<{ permissions: PermissionCatalogEntry[] }>(
      "/permissions/catalog",
    ),

  roles: () => apiRequest<{ roles: PermissionRole[] }>("/permissions/roles"),

  createRole: (name: string, permissionCodes: string[]) =>
    apiRequest<{ role: PermissionRole }>("/permissions/roles", {
      method: "POST",
      body: JSON.stringify({ name, permissionCodes }),
    }),

  updateRole: (roleId: string, name: string, permissionCodes: string[]) =>
    apiRequest<{ role: PermissionRole }>(
      `/permissions/roles/${encodeURIComponent(roleId)}`,
      {
        method: "PUT",
        body: JSON.stringify({ name, permissionCodes }),
      },
    ),

  users: () => apiRequest<{ users: AccessUser[] }>("/permissions/users"),

  userAccess: (userId: string) =>
    apiRequest<UserAccessResponse>(
      `/permissions/users/${encodeURIComponent(userId)}`,
    ),

  replaceUserRoles: (userId: string, roleIds: string[], reason: string) =>
    apiRequest<{ roleIds: string[]; effectivePermissions: string[] }>(
      `/permissions/users/${encodeURIComponent(userId)}/roles`,
      {
        method: "PUT",
        body: JSON.stringify({ roleIds, reason }),
      },
    ),

  setUserOverride: (
    userId: string,
    permissionCode: string,
    effect: "ALLOW" | "DENY" | "INHERIT",
    reason: string,
  ) =>
    apiRequest<{
      permissionCode: string;
      effect: "ALLOW" | "DENY" | "INHERIT";
      effectivePermissions: string[];
    }>(
      `/permissions/users/${encodeURIComponent(userId)}/grants/${encodeURIComponent(permissionCode)}`,
      {
        method: "PUT",
        body: JSON.stringify({ effect, reason }),
      },
    ),
};
