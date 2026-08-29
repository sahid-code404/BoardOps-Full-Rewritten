import type { Context } from "hono";

import type { AppEnv } from "../app-env";
import { ApiError } from "../http/api-error";
import type { AccountState, AuthPrincipal } from "./types";
import { objectBody } from "./validation";

export interface InstitutionRow {
  id: string;
  slug: string;
  display_name: string;
  institution_user_id_label: string;
}

export async function readJson(
  c: Context<AppEnv>,
): Promise<Record<string, unknown>> {
  try {
    return objectBody(await c.req.json<unknown>());
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Request body must contain valid JSON.",
    );
  }
}

export function isLocalDevelopmentRequest(c: Context<AppEnv>): boolean {
  if (c.env.BOARDOPS_ENV !== "development") return false;
  const hostname = new URL(c.req.url).hostname;
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

export function currentPrincipal(c: Context<AppEnv>): AuthPrincipal {
  const principal = c.get("auth");
  if (!principal) {
    throw new ApiError(401, "AUTH_REQUIRED", "Authentication is required.");
  }
  return principal;
}

export async function institutionBySlug(
  db: D1Database,
  slug: string,
): Promise<InstitutionRow | null> {
  return db
    .prepare(
      `SELECT id, slug, display_name, institution_user_id_label
       FROM institutions WHERE slug = ?`,
    )
    .bind(slug.toLowerCase())
    .first<InstitutionRow>();
}

export function stateEventStatement(
  db: D1Database,
  input: {
    institutionId: string;
    userId: string;
    fromState?: AccountState;
    toState: AccountState;
    reason?: string;
    actorUserId?: string;
    correlationId: string;
    createdAtMs: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO account_state_events
       (id, institution_id, user_id, from_state, to_state, reason,
        actor_user_id, correlation_id, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      input.institutionId,
      input.userId,
      input.fromState ?? null,
      input.toState,
      input.reason ?? null,
      input.actorUserId ?? null,
      input.correlationId,
      input.createdAtMs,
    );
}

export function auditStatement(
  db: D1Database,
  input: {
    institutionId?: string;
    actorRef?: string;
    action: string;
    entityType: string;
    entityId?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
    correlationId: string;
    createdAtMs: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO audit_events
       (id, institution_id, actor_ref, action, entity_type, entity_id, reason,
        metadata_json, correlation_id, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      input.institutionId ?? null,
      input.actorRef ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.reason ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      input.correlationId,
      input.createdAtMs,
    );
}

export function outboxStatement(
  db: D1Database,
  input: {
    institutionId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    correlationId: string;
    createdAtMs: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO outbox_events
       (id, institution_id, event_type, aggregate_type, aggregate_id,
        payload_json, correlation_id, state, attempt_count, available_at_ms, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      input.institutionId,
      input.eventType,
      input.aggregateType,
      input.aggregateId,
      JSON.stringify(input.payload),
      input.correlationId,
      input.createdAtMs,
      input.createdAtMs,
    );
}
