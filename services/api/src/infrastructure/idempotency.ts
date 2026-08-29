import { ApiError } from "../http/api-error";

export type IdempotencyReservation =
  | { kind: "reserved"; recordId: string }
  | { kind: "in_progress"; recordId: string }
  | {
      kind: "replay";
      recordId: string;
      responseStatus: number;
      responseBodyJson: string;
    };

interface ReserveIdempotencyInput {
  institutionId?: string;
  scope: string;
  key: string;
  requestHash: string;
  expiresAtMs: number;
}

interface IdempotencyRow {
  id: string;
  request_hash: string;
  state: string;
  response_status: number | null;
  response_body_json: string | null;
}

export function requireIdempotencyKey(headers: Headers): string {
  const key = headers.get("Idempotency-Key")?.trim();
  if (!key) {
    throw new ApiError(
      400,
      "IDEMPOTENCY_KEY_REQUIRED",
      "An Idempotency-Key header is required for this operation.",
    );
  }
  return key;
}

export async function hashIdempotencyPayload(payload: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function reserveIdempotency(
  db: D1Database,
  input: ReserveIdempotencyInput,
): Promise<IdempotencyReservation> {
  const now = Date.now();
  const recordId = crypto.randomUUID();
  const insert = await db
    .prepare(
      `INSERT OR IGNORE INTO idempotency_records
       (id, institution_id, scope, idempotency_key, request_hash, state,
        created_at_ms, updated_at_ms, expires_at_ms)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)`,
    )
    .bind(
      recordId,
      input.institutionId ?? null,
      input.scope,
      input.key,
      input.requestHash,
      now,
      now,
      input.expiresAtMs,
    )
    .run();

  if (insert.meta.changes === 1) {
    return { kind: "reserved", recordId };
  }

  const existing = await db
    .prepare(
      `SELECT id, request_hash, state, response_status, response_body_json
       FROM idempotency_records
       WHERE scope = ? AND idempotency_key = ?`,
    )
    .bind(input.scope, input.key)
    .first<IdempotencyRow>();

  if (!existing) {
    throw new ApiError(
      500,
      "IDEMPOTENCY_STATE_LOST",
      "The idempotency record could not be resolved.",
    );
  }

  if (existing.request_hash !== input.requestHash) {
    throw new ApiError(
      409,
      "IDEMPOTENCY_KEY_REUSED",
      "The Idempotency-Key was already used for a different request.",
    );
  }

  if (
    existing.state === "COMPLETED" &&
    existing.response_status !== null &&
    existing.response_body_json !== null
  ) {
    return {
      kind: "replay",
      recordId: existing.id,
      responseStatus: existing.response_status,
      responseBodyJson: existing.response_body_json,
    };
  }

  return { kind: "in_progress", recordId: existing.id };
}

export async function completeIdempotency(
  db: D1Database,
  recordId: string,
  responseStatus: number,
  responseBodyJson: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE idempotency_records
       SET state = 'COMPLETED', response_status = ?, response_body_json = ?, updated_at_ms = ?
       WHERE id = ? AND state = 'PENDING'`,
    )
    .bind(responseStatus, responseBodyJson, Date.now(), recordId)
    .run();
}
