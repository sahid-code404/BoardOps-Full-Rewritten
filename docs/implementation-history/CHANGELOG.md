# BoardOps Change Log

## Unreleased

### Phase 03 — Backend foundation

- Added the Cloudflare Worker fetch/queue/workflow runtime foundation around Hono.
- Added D1 migration `0001_backend_foundation.sql` for institutions, idempotency, outbox, append-only audit, and background-task infrastructure.
- Added explicit development/staging/production D1, R2, Queue/DLQ, and Workflow bindings.
- Added `/api/v1/ready`, safe centralized API error envelopes, request IDs, and structured request logging.
- Added Web-Crypto SHA-256 idempotency reservation/replay helpers with conflicting-key rejection.
- Added a strict versioned infrastructure queue message boundary and durable Workflow capability probe.
- Added local D1 migration/schema verification to the main CI gate without introducing an ORM or new runtime dependency.
- Verified Web/API, local D1, Flutter Android, and Flutter iOS gates green in GitHub Actions run `33264402664`.
- Documented that remote D1 IDs remain deliberate placeholders until real staging/production resources are provisioned.

### Phase 02 — Shared design language

- Added a canonical platform-neutral design-token source shared by React/Vite and Flutter.
- Added generated Web CSS and Flutter token outputs with drift verification.
- Preserved/refined the legacy purple/graphite, rounded, glass-heavy visual identity without copying legacy framework code.
- Added bounded glass rules to avoid nested backdrop-filter stacks.
- Added Web `GlassSurface`, `BoardOpsButton` and `StatusChip` primitives.
- Added Flutter BoardOps theme, `GlassPanel` and `BoardOpsStatusChip` primitives.
- Added responsive Phase 02 preview surfaces, semantic light/dark colors, reduced-motion behavior and 44 px minimum touch targets.
- Added Phase 02 architecture and implementation-history documentation.
- Verified Web/API, Flutter Android and Flutter iOS gates green in GitHub Actions run `33263308288`.
- Merged Phase 02 into `main` before beginning Phase 03.

### Phase 01 — Architecture

- Created the clean monorepo foundation for Web, API and Flutter.
- Added the initial OpenAPI v1 contract, architecture/environment boundaries and CI foundation.
- Added deterministic `pnpm-lock.yaml` and Flutter `pubspec.lock` files.
- Pinned TypeScript 6.0.3 because the selected `typescript-eslint` release does not officially support TypeScript 7.
- Replaced handwritten Worker binding placeholders with Wrangler-generated binding types.
- Added isolated API Vitest configuration so unit tests do not load the Cloudflare production Vite plugin.
- Verified Web/API, Android and iOS foundation jobs green in GitHub Actions run `33262163292`.
- Merged Phase 01 into `main` before beginning Phase 02.
