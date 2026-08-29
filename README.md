# BoardOps

BoardOps is being rebuilt from scratch as a production-grade institutional mess operations and accounting ecosystem.

## Current phase

**Phase 03 — Backend foundation is runnable and ready for local testing.**

Active implementation branch: `phase/03-backend-foundation`.

Phase 01 and Phase 02 are merged into `main`. The existing application at `sahid-code404/BoardOpsv2rewrite` remains a read-only visual and functional reference; legacy framework code is not copied into the rewrite.

Phase 03 establishes the backend substrate before authentication/business domains:

- Cloudflare Worker + Hono HTTP application;
- D1 migration foundation;
- development/staging/production D1, R2, Queue/DLQ, and Workflow bindings;
- liveness/readiness endpoints;
- stable safe API error envelopes;
- request IDs and structured logs;
- idempotency reservation/replay foundation;
- outbox, append-only audit, and background-task infrastructure tables;
- versioned queue boundary;
- durable Workflow capability probe;
- local D1 migration verification in CI.

No business module is implemented in this phase.

## Verified Phase 03 implementation CI

GitHub Actions run `33264402664` passed all required jobs:

- Web/API formatting, lint, TypeScript, tests and builds;
- Wrangler binding generation;
- local D1 migration and schema verification;
- Flutter analyze and widget/unit tests;
- Android debug APK build;
- iOS no-codesign compile validation.

## Local Phase 03 testing

From the repository root:

```bash
git fetch origin
git switch phase/03-backend-foundation
git pull --ff-only origin phase/03-backend-foundation

corepack enable
corepack prepare pnpm@11.23.0 --activate
pnpm install --frozen-lockfile

pnpm db:verify:local
```

Then start the API:

```bash
pnpm --filter @boardops/api dev
```

In another terminal, verify:

```bash
curl -i http://127.0.0.1:8787/api/v1/health
curl -i http://127.0.0.1:8787/api/v1/ready
curl -i http://127.0.0.1:8787/api/v1/meta
```

Expected results:

- `/api/v1/health` returns HTTP 200 with `status: "ok"`;
- `/api/v1/ready` returns HTTP 200 with `status: "ready"` and D1/R2/Queue/Workflow resource flags `true`;
- responses include `x-request-id`;
- unknown routes return the stable `NOT_FOUND` error envelope.

The Phase 02 Web preview is unchanged. To regression-check it in another terminal:

```bash
pnpm --filter @boardops/web dev
```

Then open `http://localhost:5173`.

## Remote deployment warning

Staging/production Cloudflare resources are not provisioned by this phase. The D1 IDs in `services/api/wrangler.jsonc` are deliberate placeholder UUIDs. Do not run remote migrations/deployments until the real environment-specific resources exist and those non-secret IDs are configured.

See `docs/architecture/BACKEND-FOUNDATION.md` for the full Phase 03 architecture and operational rules.
