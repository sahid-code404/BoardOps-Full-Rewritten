import { describe, expect, it } from "vitest";

import { ApiError } from "../http/api-error";
import { hashIdempotencyPayload, requireIdempotencyKey } from "./idempotency";

describe("idempotency foundation", () => {
  it("requires an explicit idempotency key", () => {
    expect(() => requireIdempotencyKey(new Headers())).toThrowError(ApiError);
    expect(
      requireIdempotencyKey(new Headers({ "Idempotency-Key": " operation-1 " })),
    ).toBe("operation-1");
  });

  it("produces deterministic request hashes", async () => {
    const first = await hashIdempotencyPayload('{"amount_minor":125050}');
    const second = await hashIdempotencyPayload('{"amount_minor":125050}');
    const changed = await hashIdempotencyPayload('{"amount_minor":125051}');
    expect(first).toBe(second);
    expect(first).not.toBe(changed);
    expect(first).toHaveLength(64);
  });
});
