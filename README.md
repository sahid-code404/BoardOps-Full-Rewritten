# BoardOps

BoardOps is being rebuilt from scratch as a production-grade institutional mess operations and accounting ecosystem.

## Current phase

**Phase 05 — Permissions is runnable and ready for local testing.**

Active implementation branch: `phase/05-permissions`.

Phases 01–04 are merged into `main`. The existing application at `sahid-code404/BoardOpsv2rewrite` remains a read-only visual and functional reference; legacy framework code is not copied into the rewrite.

Phase 05 replaces role-name authorization assumptions with one institution-scoped permission engine shared across backend, Web, and Flutter:

- canonical permission codes;
- backend-authoritative exact/all/any permission guards;
- role inheritance plus direct user ALLOW/DENY overrides;
- deterministic DENY precedence;
- institution-scoped role and user-access administration;
- reasoned and audited permission mutations;
- recent STEP_UP verification for high-risk access changes;
- self-lockout protection for `permissions.manage`;
- immutable system-role protection through the custom-role API;
- Web Access Control workspace at `/permissions`;
- Flutter permission policy, visibility, and route-guard primitives;
- local end-to-end permission smoke coverage in CI.

Phase 05 does not claim destructive role deletion, break-glass administration, the final application shell/navigation, or later business-domain permission bindings are complete. Those remain explicit later-phase work.

## Verified Phase 05 implementation CI

GitHub Actions run `33270319964` passed all required implementation jobs:

- locked dependency installation;
- formatting and lint;
- TypeScript plus Wrangler binding generation;
- Web/API unit tests;
- local D1 migration verification;
- authentication plus permission end-to-end smoke testing;
- Web/API builds;
- Flutter analyze and widget/unit tests;
- Android debug APK build;
- iOS no-codesign compile validation.

## Local Phase 05 testing

From the repository root:

```bash
git fetch origin
git switch phase/05-permissions
git pull --ff-only origin phase/05-permissions

corepack enable
corepack prepare pnpm@11.23.0 --activate
pnpm install --frozen-lockfile
pnpm db:verify:local
```

Start the API and keep this terminal running:

```bash
pnpm --filter @boardops/api dev
```

In a second terminal, run the complete authentication + permission smoke test:

```bash
cd ~/BoardOps-Full-Rewritten
pnpm auth:smoke:local
```

The smoke flow verifies authentication regression behavior first, then role inheritance, denied actions, direct DENY, direct ALLOW, recent step-up enforcement, permission mutation auditing, and self-lockout prevention.

Start the Web client in a third terminal:

```bash
cd ~/BoardOps-Full-Rewritten
pnpm --filter @boardops/web dev
```

Open `http://localhost:5173/auth`.

For manual local sign-in, bootstrap the development-only demo administrator:

```bash
curl -s -X POST http://127.0.0.1:8787/api/v1/dev/bootstrap \
  -H 'content-type: application/json' \
  -d '{}'
```

Use the returned local demo credentials to sign in. After authentication, open `http://localhost:5173/permissions` or use the permission-aware Access Control entry point from the account page.

Manual Phase 05 checks should confirm that:

- effective permissions are visible;
- custom role permissions can be edited only after recent STEP_UP verification;
- user role assignments require a reason;
- direct ALLOW/DENY/INHERIT overrides require a reason;
- a direct DENY wins over role-granted access;
- an actor cannot remove their own effective `permissions.manage` through ordinary self-service changes;
- unauthorized actions remain denied by the API even if client UI is manipulated.

To regression-check Flutter after installing Flutter 3.47.1 and the appropriate Android/iOS SDK:

```bash
bash scripts/bootstrap-mobile.sh
cd apps/mobile
flutter test
flutter run
```

iOS device/simulator work requires macOS/Xcode. Android requires an Android SDK plus a connected device or emulator.

## Security notes

Permission checks are backend-authoritative and fail closed. Client-side visibility is convenience only. Permission mutations are institution-scoped, online-only, audited, reasoned where required, and protected by recent STEP_UP verification for high-risk changes. Web browser sessions remain HttpOnly cookies and Flutter durable tokens remain in OS-backed secure storage.

## Remote deployment warning

Staging/production Cloudflare resources are not provisioned by Phase 05. The D1 IDs in `services/api/wrangler.jsonc` remain deliberate placeholder UUIDs. Do not run remote migrations or deployments until real environment-specific resources are configured.

See `docs/architecture/PERMISSIONS.md`, `docs/decisions/ADR-016-PERMISSION-ENGINE.md`, `docs/api/CONTRACT.md`, and `docs/implementation-history/PHASE-05-permissions.md` for the Phase 05 design and verification record.
