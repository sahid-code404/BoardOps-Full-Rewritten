# BoardOps Change Log

## Unreleased

### Phase 02 — Shared design language

- Added a canonical platform-neutral design-token source shared by React/Vite and Flutter.
- Added generated Web CSS and Flutter token outputs with drift verification.
- Preserved/refined the legacy purple/graphite, rounded, glass-heavy visual identity without copying legacy framework code.
- Added bounded glass rules to avoid nested backdrop-filter stacks.
- Added Web `GlassSurface`, `BoardOpsButton` and `StatusChip` primitives.
- Added Flutter BoardOps theme, `GlassPanel` and `BoardOpsStatusChip` primitives.
- Added responsive Phase 02 preview surfaces, semantic light/dark colors, reduced-motion behavior and 44 px minimum touch targets.
- Added Phase 02 architecture and implementation-history documentation.

### Phase 01 — Architecture

- Created the clean monorepo foundation for Web, API and Flutter.
- Added the initial OpenAPI v1 contract, architecture/environment boundaries and CI foundation.
- Added deterministic `pnpm-lock.yaml` and Flutter `pubspec.lock` files.
- Pinned TypeScript 6.0.3 because the selected `typescript-eslint` release does not officially support TypeScript 7.
- Replaced handwritten Worker binding placeholders with Wrangler-generated binding types.
- Added isolated API Vitest configuration so unit tests do not load the Cloudflare production Vite plugin.
- Verified Web/API, Android and iOS foundation jobs green in GitHub Actions run `33262163292`.
- Merged Phase 01 into `main` before beginning Phase 02.
