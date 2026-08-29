import { Hono } from "hono";

import type { AppEnv } from "../app-env";
import { ApiError } from "../http/api-error";
import {
  auditStatement,
  currentPrincipal,
  readJson,
  stateEventStatement,
} from "./route-helpers";
import { requirePermission } from "./session";
import type { AccountState } from "./types";
import { optionalString, reviewAction } from "./validation";

export const reviewRoutes = new Hono<AppEnv>();

reviewRoutes.get(
  "/registrations",
  requirePermission("resident.approve"),
  async (c) => {
    const principal = currentPrincipal(c);
    const rows = await c.env.DB
      .prepare(
        `SELECT id, institution_user_id, email, display_name, account_state,
                email_verified_at_ms, created_at_ms, updated_at_ms
         FROM users
         WHERE institution_id = ?
           AND account_state IN ('PENDING_REVIEW', 'CHANGES_REQUESTED')
         ORDER BY created_at_ms ASC
         LIMIT 100`,
      )
      .bind(principal.institutionId)
      .all();

    return c.json({
      registrations: rows.results,
      requestId: c.get("requestId"),
    });
  },
);

reviewRoutes.post(
  "/registrations/:userId/review",
  requirePermission("resident.approve"),
  async (c) => {
    const principal = currentPrincipal(c);
    const body = await readJson(c);
    const action = reviewAction(body);
    const reason = optionalString(body, "reason", 500);
    if (action !== "APPROVE" && !reason) {
      throw new ApiError(
        422,
        "REASON_REQUIRED",
        "A reason is required when rejecting or requesting changes.",
      );
    }

    const userId = c.req.param("userId");
    const target = await c.env.DB
      .prepare(
        `SELECT id, institution_id, account_state
         FROM users WHERE id = ? AND institution_id = ?`,
      )
      .bind(userId, principal.institutionId)
      .first<{
        id: string;
        institution_id: string;
        account_state: AccountState;
      }>();

    if (!target) {
      throw new ApiError(
        404,
        "REGISTRATION_NOT_FOUND",
        "Registration not found.",
      );
    }
    if (target.account_state !== "PENDING_REVIEW") {
      throw new ApiError(
        409,
        "ACCOUNT_STATE_CONFLICT",
        "Only registrations pending review can be reviewed.",
      );
    }

    const now = Date.now();
    const correlationId = c.get("requestId");
    if (action === "APPROVE") {
      await c.env.DB.batch([
        c.env.DB
          .prepare(
            `UPDATE users
             SET account_state = 'ACTIVE', approved_at_ms = ?, approved_by_user_id = ?,
                 updated_at_ms = ?, version = version + 1
             WHERE id = ? AND account_state = 'PENDING_REVIEW'`,
          )
          .bind(now, principal.userId, now, userId),
        stateEventStatement(c.env.DB, {
          institutionId: target.institution_id,
          userId,
          fromState: "PENDING_REVIEW",
          toState: "APPROVED",
          actorUserId: principal.userId,
          correlationId,
          createdAtMs: now,
        }),
        stateEventStatement(c.env.DB, {
          institutionId: target.institution_id,
          userId,
          fromState: "APPROVED",
          toState: "ACTIVE",
          actorUserId: principal.userId,
          correlationId,
          createdAtMs: now,
        }),
        auditStatement(c.env.DB, {
          institutionId: target.institution_id,
          actorRef: principal.userId,
          action: "auth.registration.approved",
          entityType: "user",
          entityId: userId,
          correlationId,
          createdAtMs: now,
        }),
      ]);
      return c.json({ status: "active", requestId: correlationId });
    }

    const requiredReason = reason;
    if (!requiredReason) {
      throw new ApiError(422, "REASON_REQUIRED", "A reason is required.");
    }
    const nextState: AccountState =
      action === "REQUEST_CHANGES" ? "CHANGES_REQUESTED" : "REJECTED";

    await c.env.DB.batch([
      c.env.DB
        .prepare(
          `UPDATE users
           SET account_state = ?, updated_at_ms = ?, version = version + 1
           WHERE id = ? AND account_state = 'PENDING_REVIEW'`,
        )
        .bind(nextState, now, userId),
      stateEventStatement(c.env.DB, {
        institutionId: target.institution_id,
        userId,
        fromState: "PENDING_REVIEW",
        toState: nextState,
        reason: requiredReason,
        actorUserId: principal.userId,
        correlationId,
        createdAtMs: now,
      }),
      auditStatement(c.env.DB, {
        institutionId: target.institution_id,
        actorRef: principal.userId,
        action:
          action === "REQUEST_CHANGES"
            ? "auth.registration.changes_requested"
            : "auth.registration.rejected",
        entityType: "user",
        entityId: userId,
        reason: requiredReason,
        correlationId,
        createdAtMs: now,
      }),
    ]);

    return c.json({ status: nextState.toLowerCase(), requestId: correlationId });
  },
);
