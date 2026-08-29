# CI Foundation

GitHub Actions is a required phase gate on every implementation branch and pull request. A phase is not complete while any required job is red.

## Web/API gate

The current Web/API job verifies:

- Node 24.20.0 and pnpm 11.23.0;
- frozen `pnpm-lock.yaml` installation;
- Prettier formatting;
- ESLint;
- TypeScript plus Wrangler-generated Worker binding types;
- Web/API unit tests;
- local D1 migration and schema verification;
- a real local authentication end-to-end smoke flow;
- Web and API production builds.

The authentication smoke starts the Worker against local D1, waits for `/api/v1/health`, runs the Phase 04 lifecycle script, and always stops the temporary Worker process. It verifies runtime behavior rather than treating compilation as a runnable-product proof.

## Flutter Android gate

The Android job uses Flutter 3.47.1, resolves the locked `pubspec.lock`, runs `flutter analyze` and tests, materializes the standard Android scaffold, and builds a debug APK. This gate also proves native plugin compatibility for packages such as `flutter_secure_storage`.

## Flutter iOS gate

The iOS job runs on macOS with Flutter 3.47.1, resolves the locked packages, materializes the standard iOS scaffold, and performs a no-codesign debug compile. This catches iOS plugin/native compatibility regressions without requiring signing credentials in ordinary CI.

## Generated platform scaffolds

Generated Flutter Android/iOS scaffolds remain mechanical build artifacts during these foundation phases. BoardOps application code lives under `apps/mobile/lib`, while CI recreates the native scaffold needed to prove that the app compiles on each platform.

## Database discipline

CI applies the complete local D1 migration chain from a clean/known local environment. Authentication migrations therefore cannot pass merely because an existing developer database happened to contain the expected tables.

## Release principle

Passing CI is necessary but not sufficient for production deployment. Real staging/production Cloudflare resources, email delivery, signing, OTA, and production security/recovery procedures are introduced and verified in their dedicated later phases.
