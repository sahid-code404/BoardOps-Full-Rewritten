import { constantTimeTextEqual, sha256Text } from "./crypto";

export const OTP_PURPOSE_STEP_UP = "STEP_UP" as const;
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000;
export const OTP_MAX_REQUESTS_PER_WINDOW = 5;

const OTP_SPACE = 1_000_000;
const UINT32_SPACE = 0x1_0000_0000;
const MAX_UNBIASED_UINT32 = Math.floor(UINT32_SPACE / OTP_SPACE) * OTP_SPACE;

export function generateNumericOtp(): string {
  const values = new Uint32Array(1);
  let value = UINT32_SPACE - 1;
  while (value >= MAX_UNBIASED_UINT32) {
    crypto.getRandomValues(values);
    value = values[0]!;
  }
  return (value % OTP_SPACE).toString().padStart(6, "0");
}

export function isValidOtpCode(value: string): boolean {
  return /^\d{6}$/u.test(value);
}

export async function otpCodeHash(
  challengeId: string,
  code: string,
): Promise<string> {
  return sha256Text(`boardops-otp:${challengeId}:${code}`);
}

export async function otpCodeMatches(
  challengeId: string,
  code: string,
  expectedHash: string,
): Promise<boolean> {
  const candidateHash = await otpCodeHash(challengeId, code);
  return constantTimeTextEqual(candidateHash, expectedHash);
}
