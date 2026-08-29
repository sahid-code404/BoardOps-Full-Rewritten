import { describe, expect, it } from "vitest";

import { hasPermission, PermissionGate } from "./PermissionGate";

describe("web permission visibility", () => {
  it("checks exact permission codes", () => {
    expect(hasPermission(["permissions.read"], "permissions.read")).toBe(true);
    expect(hasPermission(["permissions.read"], "permissions.manage")).toBe(false);
  });

  it("exports a reusable visibility gate", () => {
    expect(PermissionGate).toBeTypeOf("function");
  });
});
