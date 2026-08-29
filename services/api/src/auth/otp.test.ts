import { describe, expect, it } from "vitest";

import {
  generateNumericOtp,
  isValidOtpCode,
  otpCodeHash,
  otpCodeMatches,
} from "./otp";

describe("authentication OTP", () => {
  it("generates a six-digit code", () => {
    const code = generateNumericOtp();
    expect(code).toMatch(/^\d{6}$/u);
    expect(isValidOtpCode(code)).toBe(true);
  });

  it("binds the stored hash to both challenge and code", async () => {
    const hash = await otpCodeHash("challenge-a", "123456");
    expect(await otpCodeMatches("challenge-a", "123456", hash)).toBe(true);
    expect(await otpCodeMatches("challenge-a", "654321", hash)).toBe(false);
    expect(await otpCodeMatches("challenge-b", "123456", hash)).toBe(false);
  });
});
