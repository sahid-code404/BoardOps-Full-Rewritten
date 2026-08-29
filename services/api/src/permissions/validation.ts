import { ApiError } from "../http/api-error";

export type PermissionOverrideEffect = "ALLOW" | "DENY" | "INHERIT";

export function requiredStringArray(
  body: Record<string, unknown>,
  key: string,
  maximumItems: number,
): string[] {
  const value = body[key];
  if (!Array.isArray(value)) {
    throw new ApiError(422, "VALIDATION_ERROR", `${key} must be an array.`);
  }
  if (value.length > maximumItems) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      `${key} may contain at most ${maximumItems} items.`,
    );
  }

  const result = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string") {
      throw new ApiError(
        422,
        "VALIDATION_ERROR",
        `${key} must contain only text values.`,
      );
    }
    const normalized = entry.trim();
    if (!normalized || normalized.length > 100) {
      throw new ApiError(
        422,
        "VALIDATION_ERROR",
        `${key} contains an invalid value.`,
      );
    }
    result.add(normalized);
  }
  return [...result];
}

export function permissionOverrideEffect(
  body: Record<string, unknown>,
): PermissionOverrideEffect {
  const value = body.effect;
  if (value === "ALLOW" || value === "DENY" || value === "INHERIT") {
    return value;
  }
  throw new ApiError(
    422,
    "VALIDATION_ERROR",
    "effect must be ALLOW, DENY, or INHERIT.",
  );
}

export async function assertPermissionCodesExist(
  db: D1Database,
  codes: readonly string[],
): Promise<void> {
  if (codes.length === 0) return;
  const placeholders = codes.map(() => "?").join(", ");
  const rows = await db
    .prepare(`SELECT code FROM permissions WHERE code IN (${placeholders})`)
    .bind(...codes)
    .all<{ code: string }>();
  const existing = new Set(rows.results.map((row) => row.code));
  const unknown = codes.filter((code) => !existing.has(code));
  if (unknown.length > 0) {
    throw new ApiError(422, "UNKNOWN_PERMISSION", "Unknown permission code.", {
      unknownPermissions: unknown,
    });
  }
}
