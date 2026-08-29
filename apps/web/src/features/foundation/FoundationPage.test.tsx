import { describe, expect, it } from "vitest";

import { BoardOpsButton, GlassSurface, StatusChip } from "../../design";
import { FoundationPage } from "./FoundationPage";

describe("Phase 02 design-language foundation", () => {
  it("exports the preview and shared web primitives", () => {
    expect(FoundationPage).toBeTypeOf("function");
    expect(BoardOpsButton).toBeTypeOf("function");
    expect(GlassSurface).toBeTypeOf("function");
    expect(StatusChip).toBeTypeOf("function");
  });
});
