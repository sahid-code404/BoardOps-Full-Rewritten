# Phase 03 Backend Foundation

## Purpose

Phase 03 turns the Phase 01 Cloudflare architecture baseline into a runnable backend foundation without introducing business-domain behavior early.

The authoritative backend remains a Cloudflare Worker using Hono. D1 is the relational system of record, R2 is the file/object boundary, Queues are the asynchronous transport boundary, and Workflows are the durable multi-step orchestration boundary.

## Worker entry points

`services/api/src/index.ts` exports one Worker module with:

- `fetch` for the versioned Hono HTTP API;
- `queue` for versioned infrastructure queue messages;
- `BoardOpsFoundationWorkflow` for durable workflow registration.

HTTP application construction lives separately in `services/api/src/app.ts` so ordinary unit tests do not need to import the Cloudflare workflow runtime module.

## HTTP foundation

Current infrastructure endpoints are:

- `GET /api/v1/health` — process/liveness response;
- `GET /api/v1/ready` — verifies the D1 binding is usable and that required R2, Queue, and Workflow bindings exist;
- `GET /api/v1/meta` — safe environment/API metadata.

Unknown routes use a stable `NOT_FOUND` envelope. Unexpected exceptions use the centralized safe `INTERNAL_ERROR` response and do not return stack traces or raw exception details to clients.

Every request receives a request/correlation identifier through Hono request-ID middleware. Structured request logs contain request ID, method, path, status, duration, and environment. Query strings and request bodies are intentionally not logged by the foundation middleware.

## D1 migration foundation

Canonical migrations live under `migrations/d1`.

Migration `0001_backend_foundation.sql` establishes infrastructure tables only:

### `institutions`

Creates the top-level institution identifier required for later tenant scoping.

### `idempotency_records`

Stores operation scope, idempotency key, request hash, state, cached response, and expiry. The `(scope, idempotency_key)` uniqueness rule prevents duplicate reservation of the same operation key.

### `outbox_events`

Stores committed asynchronous events before external dispatch. This is the foundation for the transaction/outbox pattern so later domain writes do not rely on non-atomic direct side effects.

### `audit_events`

Stores append-only audit facts. Database triggers reject both `UPDATE` and `DELETE` against audit rows.

### `background_tasks`

Stores durable operation identity/state for later asynchronous and workflow-backed tasks.

Foreign keys are enabled by the migration and indexes cover the expected infrastructure lookup/dispatch paths.

## Idempotency boundary

`services/api/src/infrastructure/idempotency.ts` provides reusable infrastructure primitives:

- require a non-empty `Idempotency-Key` header;
- hash request payloads with SHA-256 through Web Crypto;
- atomically reserve a key with `INSERT OR IGNORE`;
- reject reuse of the same key for a different request hash with HTTP 409;
- distinguish a newly reserved request, an in-progress duplicate, and a completed replay;
- persist the response status/body after successful completion.

The caller owns the operation scope and expiry policy because retention requirements belong to each later business use case.

## Queue boundary

Infrastructure queue messages are explicitly versioned. The Phase 03 consumer accepts only:

```text
version: 1
kind: outbox-dispatch
eventId: <non-empty string>
correlationId: <non-empty string>
```

Malformed/unknown messages are logged and acknowledged instead of being retried forever as poison messages. Phase 03 deliberately does not perform business side effects yet.

Development, staging, and production queue consumers use bounded batches, retries, and dedicated dead-letter queue names.

## Workflow boundary

`BoardOpsFoundationWorkflow` proves the Worker can expose a durable Workflow entrypoint and execute a named durable step. It accepts only the Phase 03 `foundation-probe` parameter shape.

Business workflows are intentionally deferred to later phases; this class is an infrastructure capability checkpoint, not a business process.

## R2 boundary

`FILES` is the platform object-storage binding. Phase 03 validates that the binding exists but does not yet define domain file metadata or upload/download authorization rules. Those belong to the relevant later modules.

## Environment isolation

Wrangler declares separate resource names for:

- development;
- staging;
- production.

Each environment has distinct D1, R2, Queue/DLQ, and Workflow names. Production data/resources must never be reused for development.

The checked-in D1 `database_id` values are deliberate non-secret placeholder UUIDs. They make local D1 development deterministic while ensuring a remote migration/deployment cannot silently target an unknown real database. Before staging or production deployment, provision the Cloudflare resources and replace the corresponding placeholder IDs with the real non-secret resource IDs.

Secrets and credentials remain outside Git and belong in the appropriate Cloudflare/GitHub/platform secret stores.

## Migration and verification commands

From the repository root:

```bash
pnpm db:migrate:local
pnpm db:verify:local
```

The verification command reapplies pending local migrations and checks that all Phase 03 infrastructure tables and append-only audit triggers exist and are queryable through D1.

Remote commands exist but are intentionally unusable until real resource IDs are configured:

```bash
pnpm --filter @boardops/api db:migrate:staging
pnpm --filter @boardops/api db:migrate:production
```

Never replace placeholder IDs with production values in an ad-hoc local patch and never commit credentials.

## CI gates

Phase 03 adds D1 migration verification to the existing locked dependency, formatting, lint, TypeScript, unit-test, Web/API build, Flutter analysis/test, Android build, and iOS compile gates.

Implementation CI run `33264402664` passed all required jobs, including the local D1 migration and verification step.

## Deferred to later phases

Phase 03 does not implement authentication, authorization, accounting, resident/member behavior, inventory, payments, offline sync, OTA, business notifications, or production resource provisioning. The next roadmap checkpoint is the authentication foundation.
