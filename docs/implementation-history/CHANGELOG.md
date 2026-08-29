# BoardOps Change Log

## Unreleased

### Phase 01 — Architecture

- Created the clean monorepo foundation for Web, API and Flutter.
- Added the initial OpenAPI v1 contract, architecture/environment boundaries and CI foundation.
- Added deterministic `pnpm-lock.yaml` and Flutter `pubspec.lock` files.
- Pinned TypeScript 6.0.3 because the selected `typescript-eslint` release does not officially support TypeScript 7.
- Replaced handwritten Worker binding placeholders with Wrangler-generated binding types.
- Added isolated API Vitest configuration so unit tests do not load the Cloudflare production Vite plugin.
- Verified Web/API, Android and iOS foundation jobs green in GitHub Actions run `33261749202`.
- Marked Phase 01 ready for manual testing and pull-request review; business functionality remains deferred to later phases.
