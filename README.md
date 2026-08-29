# BoardOps

BoardOps is being rebuilt from scratch as a production-grade institutional mess operations and accounting ecosystem.

## Current phase

**Phase 04 — Authentication foundation is runnable and ready for local testing.**

Active implementation branch: `phase/04-authentication-foundation`.

Phases 01–03 are merged into `main`. The existing application at `sahid-code404/BoardOpsv2rewrite` remains a read-only visual and functional reference; legacy framework code is not copied into the rewrite.

Phase 04 adds the first end-to-end identity and session boundary:

- institution-scoped registration with stable Institution User ID;
- email-verification and approval lifecycle;
- permission-protected registration review;
- login throttling and security audit events;
- server-side revocable sessions;
- HttpOnly Web session cookies;
- Flutter bearer sessions stored through OS-backed secure storage;
- password reset with all-session invalidation;
- bounded/replay-resistant OTP step-up verification;
- Web and Flutter authentication/account-security experiences;
- OpenAPI authentication contract;
- local D1 authentication smoke testing in CI.

Phase 04 does not claim that production email delivery, authenticator-app 2FA, permission administration, or production Cloudflare provisioning are complete. Those remain explicit later-phase work.

## Verified Phase 04 implementation CI

GitHub Actions run `33268045449` verifies the implementation checkpoint with:

- locked dependency installation;
- formatting and lint;
- TypeScript plus Wrangler binding generation;
- Web/API unit tests;
- local D1 migration verification;
- authentication end-to-end smoke testing;
- Web/API builds;
- Flutter analyze and widget/unit tests;
- Android debug APK build;
- iOS no-codesign compile validation.

## Local Phase 04 testing

From the repository root:

```bash
git fetch origin
git switch phase/04-authentication-foundation
git pull --ff-only origin phase/04-authentication-foundation

corepack enable
corepack prepare pnpm@11.23.0 --activate
pnpm install --frozen-lockfile
pnpm db:verify:local
```

Start the API:

```bash
pnpm --filter @boardops/api dev
```

In a second terminal, run the complete local authentication smoke test:

```bash
pnpm auth:smoke:local
```

Then start the Web client:

```bash
pnpm --filter @boardops/web dev
```

Open `http://localhost:5173/auth`. The Vite development server proxies `/api` to the local Worker at `http://127.0.0.1:8787`.

For manual local sign-in, bootstrap the development-only demo administrator:

```bash
curl -s -X POST http://127.0.0.1:8787/api/v1/dev/bootstrap \
  -H 'content-type: application/json' \
  -d '{}'
```

The local-only endpoint returns the demo institution/credentials used for manual testing. It is unavailable outside local development.

To exercise Flutter after installing Flutter 3.47.1 and the appropriate Android/iOS SDK:

```bash
bash scripts/bootstrap-mobile.sh
cd apps/mobile
flutter run
```

iOS device/simulator work requires macOS/Xcode. Android requires an Android SDK plus a connected device or emulator.

## Security notes

Web browser sessions use an HttpOnly cookie; Flutter durable tokens use `flutter_secure_storage`. Development verification/reset/OTP values are exposed only when both the environment is development and the request host is local. Do not turn those development conveniences into production behavior.

## Remote deployment warning

Staging/production Cloudflare resources and authentication email delivery are not provisioned by Phase 04. The D1 IDs in `services/api/wrangler.jsonc` remain deliberate placeholder UUIDs. Do not run remote migrations/deployments until real environment-specific resources exist and the non-secret resource IDs are configured.

See `docs/architecture/AUTHENTICATION.md` and `docs/decisions/ADR-015-AUTHENTICATION-SESSION-SECURITY.md` for the Phase 04 architecture and security decisions.
