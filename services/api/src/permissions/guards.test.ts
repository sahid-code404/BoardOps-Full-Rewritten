import { describe, expect, it } from "vitest";

import type { AuthPrincipal } from "../auth/types";
import { ApiError } from "../http/api-error";
import {
  STEP_UP_FRESHNESS_MS,
  assertAllPermissions,
  assertAnyPermission,
  assertPermission,
  assertRecentStepUp,
} from "./guards";

function principal(overrides: Partial<AuthPrincipal> = {}): AuthPrincipal {
  return {
    sessionId: "session-1",
    userId: "user-1",
    institutionId: "institution-1",
    institutionSlug: "demo",
    institutionUserId: "ADMIN-001",
    email: "admin@boardops.local",
    displayName: "Administrator",
    accountState: "ACTIVE",
    clientType: "WEB",
    stepUpVerifiedAtMs: 1_000_000,
    permissions: ["permissions.read", "permissions.manage"],
    ...overrides,
  };
}

describe("permission guards", () => {
  it("authorizes present permissions and denies missing permissions", () => {
    expect(() => assertPermission(principal(), "permissions.read")).not.toThrow();
    expect(() => assertPermission(principal(), "billing.close")).toThrowError(ApiError);
  });

  it("requires active account state", () => {
    expect(() =>
      assertPermission(principal({ accountState: "SUSPENDED" }), "permissions.read"),
    ).toThrowError(ApiError);
  });

  it("supports all-of and any-of action policies", () => {
    expect(() =>
      assertAllPermissions(principal(), ["permissions.read", "permissions.manage"]),
    ).not.toThrow();
    expect(() =>
      assertAnyPermission(principal(), ["billing.close", "permissions.read"]),
    ).not.toThrow();
    expect(() =>
      assertAllPermissions(principal(), ["permissions.read", "billing.close"]),
    ).toThrowError(ApiError);
  });

  it("requires recent step-up evidence for high-risk permission changes", () => {
    const now = 2_000_000;
    expect(() =>
      assertRecentStepUp(
        principal({ stepUpVerifiedAtMs: now - STEP_UP_FRESHNESS_MS }),
        now,
      ),
    ).not.toThrow();
    expect(() =>
      assertRecentStepUp(
        principal({ stepUpVerifiedAtMs: now - STEP_UP_FRESHNESS_MS - 1 }),
        now,
      ),
    ).toThrowError(ApiError);
    expect(() =>
      assertRecentStepUp(principal({ stepUpVerifiedAtMs: null }), now),
    ).toThrowError(ApiError);
  });
});
