# PHASE 03 — Backend Foundation

## Objective

Establish the production-shaped Cloudflare backend substrate before authentication and business domains are implemented.

## Scope delivered

- Cloudflare Worker fetch/queue/workflow entrypoints;
- D1 migration foundation;
- explicit development/staging/production D1, R2, Queue/DLQ, and Workflow bindings;
- liveness and readiness endpoints;
- centralized safe API error envelopes;
- request/correlation IDs and structured request logging;
- idempotency reservation/replay primitives;
- outbox/audit/background-task schema foundation;
- versioned queue-message boundary;
- durable Workflow capability probe;
- local D1 migration verification in CI.

## Files created

- `migrations/d1/0001_backend_foundation.sql`
- `services/api/src/app-env.ts`
- `services/api/src/app.ts`
- `services/api/src/http/api-error.ts`
- `services/api/src/http/error-response.ts`
- `services/api/src/infrastructure/database-readiness.ts`
- `services/api/src/infrastructure/idempotency.ts`
- `services/api/src/infrastructure/idempotency.test.ts`
- `services/api/src/infrastructure/queue.ts`
- `services/api/src/infrastructure/queue.test.ts`
- `services/api/src/infrastructure/workflow.ts`
- `services/api/src/observability/request-logging.ts`
- `docs/architecture/BACKEND-FOUNDATION.md`

## Files modified

- `services/api/src/index.ts`
- `services/api/src/index.test.ts`
- `services/api/package.json`
- `services/api/wrangler.jsonc`
- root `package.json`
- `.github/workflows/ci.yml`
- `docs/architecture/ENVIRONMENTS.md`
- `README.md`
- `docs/implementation-history/CHANGELOG.md`

## Files removed

None.

## Database migrations

`0001_backend_foundation.sql` adds:

- `institutions`;
- `idempotency_records`;
- `outbox_events`;
- append-only `audit_events` plus update/delete rejection triggers;
- `background_tasks`;
- supporting indexes and foreign keys.

No business ledger/accounting tables are introduced in this phase.

## API changes

Added:

- `GET /api/v1/ready`;
- structured request IDs on the existing health/meta foundation;
- centralized stable/safe error envelopes.

The API remains under `/api/v1`.

## Queue/workflow changes

- added `EVENT_QUEUE` producer/consumer binding with bounded batches/retries and DLQ names;
- added a strict version-1 `outbox-dispatch` infrastructure message shape;
- added `FOUNDATION_WORKFLOW` and a durable `BoardOpsFoundationWorkflow` capability probe.

No domain side effects are executed by these primitives yet.

## Storage changes

Added the `FILES` R2 binding for every environment. Domain file metadata, authorization, and upload/download flows remain deferred.

## Security changes

- safe errors do not leak unexpected exception detail;
- request logs omit bodies/query values by default;
- Web Crypto is used for request hashing;
- remote D1 IDs are non-secret placeholders, preventing accidental deployment to an unspecified database;
- no credentials or secrets were added to the repository.

## Reliability changes

- idempotency reservation distinguishes new, in-progress, conflicting, and replayed requests;
- outbox storage provides the future committed-event boundary;
- malformed queue messages are acknowledged instead of becoming infinite poison retries;
- DLQ names are defined per environment;
- audit rows are database-enforced append-only.

## Performance/memory changes

- no ORM or additional runtime package was added;
- raw D1 prepared statements keep the foundation small and Worker-native;
- queue batches are bounded to 10 messages;
- no process-local business cache/state is introduced.

## Tests

- liveness endpoint;
- readiness success/failure;
- safe 404 envelope;
- request-ID response presence;
- idempotency key requirement and SHA-256 determinism;
- queue message validation;
- local D1 migration execution and schema/trigger queries.

## CI verification

GitHub Actions run `33264402664` passed:

- locked pnpm install;
- formatting;
- lint;
- TypeScript plus Wrangler-generated bindings;
- Web/API tests;
- local D1 migration verification;
- Web/API builds;
- Flutter analysis and tests;
- Android debug APK build;
- iOS no-codesign compile validation.

## Remote deployment status

Not provisioned in Phase 03. The Wrangler resource names are committed, but D1 IDs are explicit placeholder UUIDs. Staging/production Cloudflare resources must be created and their real non-secret IDs recorded before any remote migration/deployment command is allowed to succeed.

## Local verification

The backend checkpoint is ready for local testing with Wrangler/workerd and local D1. The exact commands are documented in the repository README and provided at the checkpoint.

## Known limitations / deferred items

- no authentication or session model yet;
- no permissions yet;
- no business/domain tables or routes yet;
- no production resource provisioning yet;
- R2/Queue/Workflow are capability boundaries, not business implementations yet.

## Final status

RUNNABLE — TEST NOW.
