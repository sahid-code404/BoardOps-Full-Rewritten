import { ApiError } from "../http/api-error";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface AttemptWindowRow {
  attempt_count: number;
  window_started_at_ms: number;
  blocked_until_ms: number | null;
}

export async function assertLoginAllowed(
  db: D1Database,
  keyHash: string,
): Promise<void> {
  const row = await db
    .prepare(
      `SELECT attempt_count, window_started_at_ms, blocked_until_ms
       FROM auth_attempt_windows WHERE key_hash = ?`,
    )
    .bind(keyHash)
    .first<AttemptWindowRow>();

  if (row?.blocked_until_ms && row.blocked_until_ms > Date.now()) {
    throw new ApiError(
      429,
      "AUTH_RATE_LIMITED",
      "Too many sign-in attempts. Try again later.",
    );
  }
}

export async function recordLoginFailure(
  db: D1Database,
  keyHash: string,
): Promise<void> {
  const now = Date.now();
  const row = await db
    .prepare(
      `SELECT attempt_count, window_started_at_ms, blocked_until_ms
       FROM auth_attempt_windows WHERE key_hash = ?`,
    )
    .bind(keyHash)
    .first<AttemptWindowRow>();

  if (!row || now - row.window_started_at_ms >= WINDOW_MS) {
    await db
      .prepare(
        `INSERT INTO auth_attempt_windows
         (key_hash, attempt_count, window_started_at_ms, blocked_until_ms, updated_at_ms)
         VALUES (?, 1, ?, NULL, ?)
         ON CONFLICT(key_hash) DO UPDATE SET
           attempt_count = 1,
           window_started_at_ms = excluded.window_started_at_ms,
           blocked_until_ms = NULL,
           updated_at_ms = excluded.updated_at_ms`,
      )
      .bind(keyHash, now, now)
      .run();
    return;
  }

  const nextCount = row.attempt_count + 1;
  const blockedUntil = nextCount >= MAX_ATTEMPTS ? now + BLOCK_MS : null;
  await db
    .prepare(
      `UPDATE auth_attempt_windows
       SET attempt_count = ?, blocked_until_ms = ?, updated_at_ms = ?
       WHERE key_hash = ?`,
    )
    .bind(nextCount, blockedUntil, now, keyHash)
    .run();
}

export async function clearLoginFailures(
  db: D1Database,
  keyHash: string,
): Promise<void> {
  await db.prepare("DELETE FROM auth_attempt_windows WHERE key_hash = ?").bind(keyHash).run();
}
