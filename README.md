# BoardOps

BoardOps is being rebuilt from scratch as a production-grade institutional mess operations and accounting ecosystem.

## Current phase

**Phase 01 — Architecture checkpoint is ready for review and manual testing.**

Active implementation branch: `phase/01-architecture`.

The existing application at `sahid-code404/BoardOpsv2rewrite` remains a **read-only reference**. Its legacy implementation is not copied into the rewrite.

Phase 01 establishes only the clean technical foundation:

- React + Vite web application
- Cloudflare Workers + Hono API
- Flutter mobile application
- shared OpenAPI/API-contract package
- architecture, environment and boundary documentation
- deterministic pnpm and Flutter lockfiles
- GitHub Actions verification for Web/API/Android/iOS

Business modules intentionally begin in later phases.

## Verified Phase 01 CI

GitHub Actions run `33261749202` passed all Phase 01 jobs:

- Web/API formatting, lint, TypeScript checks, unit tests and builds
- Wrangler Worker binding type generation
- Flutter analysis and widget/unit tests
- Android debug APK build
- iOS no-codesign compile validation

## Local verification

From the repository root:

```bash
git switch phase/01-architecture
git pull

corepack enable
corepack prepare pnpm@11.23.0 --activate
pnpm install --frozen-lockfile
pnpm check

./scripts/bootstrap-mobile.sh
```

To create the Android debug APK after the bootstrap:

```bash
cd apps/mobile
flutter build apk --debug
```

To run the foundation web/API locally, use two terminals from the repository root:

```bash
pnpm --filter @boardops/api dev
```

```bash
pnpm --filter @boardops/web dev
```
