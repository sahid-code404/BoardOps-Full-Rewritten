# Architecture Baseline

## Target topology

```text
React/Vite Web ─┐
                ├── /api/v1 ── Cloudflare Workers / Hono ── D1
Flutter Mobile ─┘                         │              ├── R2
                                         │              ├── Queues
                                         │              └── Workflows
                                         └── domain events / EmailService / notifications
```

The backend is authoritative. Web and mobile never independently invent financial or permission rules.

## Planned monorepo (created only after Phase 00 acceptance)

```text
apps/web
apps/mobile
services/api
packages/api-contract
packages/design-tokens
packages/domain-spec
packages/test-fixtures
packages/config
migrations
docs
tooling
scripts
.github/workflows
```

## Shared contract

OpenAPI 3.1 is the authoritative transport contract. It drives/validates TypeScript client types, Dart models/client generation, API docs, and compatibility tests. `/api/v1/` is the versioned namespace. API errors use stable codes, safe messages, optional field validation details, and correlation IDs.

## Domain organization

`services/api` separates routes/middleware from application use cases, domain rules/state machines, repositories, auth/permissions, accounting, events/outbox, queues/workflows, files, notifications, and observability.

A common state-machine framework handles lifecycle validation. Domain events reduce direct module coupling.

## Data

D1 is relational authority. Every scoped business row carries the proper institution boundary. Money uses integer minor units. Financial ledgers and accepted audit facts are append-only/immutable. Unique constraints enforce idempotency and reference numbers. Migrations are reviewed, testable, and reversible where structurally possible; destructive financial migrations require recovery plans.

R2 stores files; D1 stores metadata/ownership. Queues handle asynchronous fan-out/retries. Workflows own durable multi-step operations, especially monthly close and recovery-sensitive processes.

## Financial transaction boundary

A money-changing command must not update a payment, then separately hope ledger/audit/outbox writes succeed. The application use case commits the authoritative domain mutation plus ledger/outbox/audit intent in one consistency boundary supported by D1. External side effects are delivered from the committed outbox with idempotent consumers.

## Web state

- TanStack Query: server state/cache/mutations.
- React Router: real URL routing and route/query state.
- React Hook Form + Zod: forms/validation.
- Zustand: small UI-shell state only; never authentication/financial authority.

## Flutter state/offline

- Riverpod: application state/dependencies.
- `go_router`: routing/deep links.
- Drift: offline relational cache + queue metadata.
- Secure storage: session secrets.
- Offline queued writes require explicit risk classification + idempotency key + visible sync state.

## Security

Use Workers-compatible primitives. Prefer Web Crypto where appropriate and an audited password-hashing strategy that actually fits Workers constraints. Cloudflare Rate Limiting protects abuse-sensitive routes. HttpOnly secure cookies are preferred on web; mobile secrets use Keychain/Keystore. No Node `fs`, process-local persistence, local SQLite server DB, or Node-only crypto assumptions enter the Worker runtime.

## Design system

Platform-neutral design tokens are source material for CSS/Tailwind and Flutter ThemeData/ThemeExtension. Glass primitives are shared per platform and bounded for performance. Accessibility and reduced-motion behavior are first-class.

## Environments

Development, staging, and production get distinct D1/R2/queue/workflow resources, secrets, domains, email/push config, and OTA channels. No real `.env`, local DB, uploads, logs, or generated artifacts are committed.
