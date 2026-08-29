import type { ReactNode } from "react";

export function hasPermission(
  permissions: readonly string[],
  permission: string,
): boolean {
  return permissions.includes(permission);
}

interface PermissionGateProps {
  permissions: readonly string[];
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  permissions,
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  return hasPermission(permissions, permission) ? children : fallback;
}
