import type { MiddlewareHandler } from "hono";

import type { AppEnv } from "../app-env";
import { resolvePrincipal } from "../auth/session";
import type { AuthPrincipal } from "../auth/types";
import { ApiError } from "../http/api-error";

export const STEP_UP_FRESHNESS_MS = 5 * 60 * 1000;

function assertActive(principal: AuthPrincipal): void {
  if (principal.accountState !== "ACTIVE") {
    throw new ApiError(
      403,
      "ACCOUNT_NOT_ACTIVE",
      "The account is not active for this operation.",
    );
  }
}

export function assertPermission(
  principal: AuthPrincipal,
  permission: string,
): void {
  assertActive(principal);
  if (!principal.permissions.includes(permission)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Permission denied.");
  }
}

export function assertAllPermissions(
  principal: AuthPrincipal,
  permissions: readonly string[],
): void {
  assertActive(principal);
  const missing = permissions.filter(
    (permission) => !principal.permissions.includes(permission),
  );
  if (missing.length > 0) {
    throw new ApiError(403, "PERMISSION_DENIED", "Permission denied.", {
      missingPermissions: missing,
    });
  }
}

export function assertAnyPermission(
  principal: AuthPrincipal,
  permissions: readonly string[],
): void {
  assertActive(principal);
  if (!permissions.some((permission) => principal.permissions.includes(permission))) {
    throw new ApiError(403, "PERMISSION_DENIED", "Permission denied.");
  }
}

export function assertRecentStepUp(
  principal: AuthPrincipal,
  now = Date.now(),
): void {
  const verifiedAt = principal.stepUpVerifiedAtMs;
  if (verifiedAt === null || now - verifiedAt > STEP_UP_FRESHNESS_MS) {
    throw new ApiError(
      403,
      "STEP_UP_REQUIRED",
      "Recent step-up verification is required for this action.",
      { freshnessMs: STEP_UP_FRESHNESS_MS },
    );
  }
}

async function principalForRequest(
  c: Parameters<MiddlewareHandler<AppEnv>>[0],
): Promise<AuthPrincipal> {
  const principal = c.get("auth") ?? (await resolvePrincipal(c));
  if (!principal) {
    throw new ApiError(401, "AUTH_REQUIRED", "Authentication is required.");
  }
  c.set("auth", principal);
  return principal;
}

export function requirePermission(
  permission: string,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    assertPermission(await principalForRequest(c), permission);
    await next();
  };
}

export function requireAllPermissions(
  permissions: readonly string[],
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    assertAllPermissions(await principalForRequest(c), permissions);
    await next();
  };
}

export function requireAnyPermission(
  permissions: readonly string[],
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    assertAnyPermission(await principalForRequest(c), permissions);
    await next();
  };
}

export function requirePermissionAndStepUp(
  permission: string,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const principal = await principalForRequest(c);
    assertPermission(principal, permission);
    assertRecentStepUp(principal);
    await next();
  };
}
