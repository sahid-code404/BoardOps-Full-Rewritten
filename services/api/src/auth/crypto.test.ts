import { describe, expect, it } from "vitest";

import {
  hashPassword,
  randomToken,
  sha256Text,
  verifyPassword,
} from "./crypto";

describe("authentication crypto", () => {
  it("hashes and verifies passwords without storing plaintext", async () => {
    const credential = await hashPassword(
      "correct horse battery staple",
      1_000,
    );
    expect(credential.hash).not.toContain("correct horse");
    expect(
      await verifyPassword(
        "correct horse battery staple",
        credential.hash,
        credential.salt,
        credential.iterations,
      ),
    ).toBe(true);
    expect(
      await verifyPassword(
        "wrong password value",
        credential.hash,
        credential.salt,
        credential.iterations,
      ),
    ).toBe(false);
  });

  it("creates high-entropy opaque tokens and deterministic token hashes", async () => {
    const token = randomToken(32);
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(await sha256Text(token)).toBe(await sha256Text(token));
    expect(await sha256Text(token)).not.toBe(await sha256Text(`${token}x`));
  });
});
