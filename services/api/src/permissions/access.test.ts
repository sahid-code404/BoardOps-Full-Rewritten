import { describe, expect, it } from "vitest";

import { resolveEffectivePermissions } from "./access";

describe("effective permission resolution", () => {
  it("combines role permissions and direct allows", () => {
    expect(
      resolveEffectivePermissions(
        ["resident.read"],
        [{ code: "report.export", effect: "ALLOW" }],
      ),
    ).toEqual(["report.export", "resident.read"]);
  });

  it("makes a direct deny authoritative over role and direct allow order", () => {
    expect(
      resolveEffectivePermissions(
        ["resident.read", "report.export"],
        [
          { code: "resident.read", effect: "ALLOW" },
          { code: "resident.read", effect: "DENY" },
        ],
      ),
    ).toEqual(["report.export"]);
  });

  it("returns deterministic sorted unique permissions", () => {
    expect(
      resolveEffectivePermissions(
        ["z.permission", "a.permission", "z.permission"],
        [{ code: "m.permission", effect: "ALLOW" }],
      ),
    ).toEqual(["a.permission", "m.permission", "z.permission"]);
  });
});
