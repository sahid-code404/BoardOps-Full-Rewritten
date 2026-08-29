import { describe, expect, it } from "vitest";

import { FoundationPage } from "./FoundationPage";

describe("FoundationPage", () => {
  it("exports the foundation surface", () => {
    expect(FoundationPage).toBeTypeOf("function");
  });
});
