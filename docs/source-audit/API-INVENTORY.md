# API Inventory / Target Contract Map

## Legacy API pattern

The source exposes Next.js route handlers under `src/app/api/...`. Observed domain families include authentication/account/profile/session/2FA, users, meal configuration/entries/guest meals/holidays/kitchen counts, billing/billing cycles/bills/monthly close, payments/refunds/adjustments/funds/restrictions, expenses/purchases, variables/formulas/policies, notifications/announcements, audit, dashboards/reports/settings/system, plus peripheral legacy areas.

Authentication specifically contains routes for login/logout/register, email verification/status/resend, forgot/reset/change password, profile/avatar, sessions, and 2FA-related behavior.

## Target rule

There is no one-to-one Next API migration. The target exposes a coherent `/api/v1/` Hono contract built from domain use cases. OpenAPI 3.1 is authoritative.

## Target resource/use-case families

### Auth / identity

`auth/register`, verification/resend/status, login/2fa, refresh-or-session continuation as chosen by session design, logout, password reset/change, sessions list/revoke, `me`, profile.

### Residents / permissions

Resident search/detail/review/approve/reject/request-changes/suspend/archive/restore; roles/permissions and assignment endpoints. All lists are institution-scoped and permission filtered.

### Meals

Meal definitions, service rules, schedule/query, resident booking mutation, guest meals, holiday rules, counts/operations, admin override with mandatory reason.

### Finance

Purchases, expenses, resident fund summary/ledger, bills, payments/deposits, payment review, refunds, adjustments, restrictions/exemptions, monthly cycles/readiness/close/status/reconcile, variables/formulas/policies/reference numbering.

### Communication / operations

Notifications, announcements, audit search, activity timeline, reports/exports, file upload metadata, settings/configuration, health/version/runtime metadata.

## Contract requirements

- Stable versioned prefix `/api/v1/`.
- Structured success/error envelopes; stable machine codes.
- Zod validation at boundaries with generated/verified OpenAPI compatibility.
- Backend permission checks on every protected action.
- Institution scoping in repository/domain layer, not trusted from arbitrary client IDs.
- Pagination/cursors, filters, sort, search semantics documented per endpoint.
- Server timestamp included where cutoff-sensitive UX needs synchronization.
- Idempotency key required for money changes and retryable high-risk mutations.
- Correlation/trace ID on responses/logs.
- File endpoints issue authorized R2 upload/download flows; no public object keys by accident.
- Contract tests cover generated TypeScript and Dart clients.
- Backward compatibility policy protects mobile versions in the field.

## Legacy patterns explicitly rejected

- Scattered `/api/*` route design with UI/server framework coupling.
- Route-level `requireRole("ADMIN")` as authorization authority.
- Multi-write finance handlers without a consistency boundary.
- Filesystem or process-memory coordination.
- Returning internal exceptions/stack details to clients.
- Mutating or deleting approved financial facts.
