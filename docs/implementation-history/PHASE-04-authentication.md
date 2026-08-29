# PHASE 04 — Authentication Foundation

## Objective

Implement the first production-shaped BoardOps authentication boundary across the Worker API, React/Vite Web client, and Flutter client, including institution-scoped identity, registration approval, sessions, password recovery, and OTP step-up verification.

## Reference requirements reviewed

Phase 04 was implemented against the consolidated BoardOps SRS and the master build requirements. The required Phase 04 surface is Web + Flutter + backend + approval + sessions + OTP, with stable Institution User ID identity, Workers-compatible password/session security, throttling, revocation, secure browser/mobile storage, and auditable authentication events.

## Architecture decisions

- the Worker API is the authentication authority;
- D1 stores authoritative users, state history, credential hashes, sessions, throttling state, OTP challenges, and permission relationships;
- opaque server-side sessions are used instead of JWT-only authentication;
- Web uses an HttpOnly session cookie;
- Flutter uses bearer sessions stored through OS-backed secure storage;
- password crypto uses Web Crypto PBKDF2-SHA256;
- approval consumes permission code `resident.approve`, not a role-name conditional;
- OTP is a bounded `STEP_UP` mechanism and does not falsely claim authenticator-app 2FA is complete;
- production email delivery remains separate from the identity/security boundary.

The irreversible session/security decision is recorded in `ADR-015-AUTHENTICATION-SESSION-SECURITY.md`.

## Files created

Major additions include:

- `migrations/d1/0002_authentication_foundation.sql`
- `migrations/d1/0003_authentication_step_up.sql`
- `services/api/src/auth/*`
- `services/api/src/dev/routes.ts`
- `scripts/auth-smoke.mjs`
- `apps/web/src/features/auth/*`
- `apps/web/src/styles/auth.css`
- `apps/mobile/lib/features/auth/*`
- `docs/architecture/AUTHENTICATION.md`
- `docs/decisions/ADR-015-AUTHENTICATION-SESSION-SECURITY.md`
- `docs/implementation-history/PHASE-04-authentication.md`

## Files modified

Major modifications include:

- `services/api/src/app.ts`
- `services/api/src/app-env.ts`
- `services/api/package.json`
- `.github/workflows/ci.yml`
- `package.json`
- `packages/api-contract/openapi/boardops-v1.yaml`
- `docs/api/CONTRACT.md`
- `apps/web/src/app/App.tsx`
- `apps/web/src/main.tsx`
- `apps/web/vite.config.ts`
- `apps/mobile/lib/routing/app_router.dart`
- `apps/mobile/pubspec.yaml`
- `apps/mobile/pubspec.lock`
- `apps/mobile/test/app_test.dart`
- `README.md`
- `docs/architecture/CI-FOUNDATION.md`
- `docs/architecture/DEPENDENCY-VERSION-MATRIX.md`
- `docs/implementation-history/CHANGELOG.md`

## Files removed

Temporary Phase 04 formatting/normalization workflows used only to materialize deterministic formatter/lock output were removed before the review checkpoint. The permanent CI workflow remains `.github/workflows/ci.yml`.

## Database migrations

`0002_authentication_foundation.sql` introduces:

- institution-scoped users with stable Institution User IDs;
- append-only account-state event history;
- PBKDF2 password credential metadata/hashes;
- revocable sessions and device metadata;
- email-verification and password-reset credential tables;
- OTP challenges;
- D1-backed authentication-attempt windows;
- permissions, roles, role permissions, user roles, and direct permission grants.

`0003_authentication_step_up.sql` adds session step-up verification state.

No accounting, inventory, meal, resident-fund, payment, or billing schema is introduced by this phase.

## API changes

The `/api/v1/auth` surface now covers:

- registration;
- email verification;
- login;
- current principal/session;
- logout;
- session/device listing;
- targeted session revocation;
- password-reset request and confirmation;
- OTP request/verify for `STEP_UP`;
- permission-protected pending-registration listing/review.

The versioned OpenAPI contract and `docs/api/CONTRACT.md` were expanded with the same Phase 04 surface.

A development-only `/api/v1/dev/bootstrap` route seeds a local institution/admin for smoke and manual testing. It is intentionally hidden outside local development.

## Web changes

The Web client now routes the default entry point to `/auth` and provides responsive authentication, registration, password-recovery, account-security, OTP, and session-management views. The existing design preview remains available under `/design`.

The Web client relies on the HttpOnly cookie rather than putting the durable session token in localStorage or exposing it through login JSON.

## Flutter changes

Flutter now includes authentication API/models/controller/gate/screens, account/session security controls, and secure token storage. `dio` 5.11.0 is used for the mobile HTTP boundary. `flutter_secure_storage` is pinned to 10.3.1 because that version is verified against the current Flutter 3.47.1 Android/iOS build gates.

Tests override secure storage with an in-memory implementation so widget tests remain deterministic and do not require platform keychain services.

## UI/UX changes

- shared BoardOps rounded/glass visual language is retained;
- sign-in and registration are first-class entry states;
- password recovery does not require exposing whether an account exists;
- pending account states can remain authenticated for status handling while protected permission operations still require `ACTIVE`;
- account security surfaces expose device/session management and step-up actions.

## Animation changes

No new animation dependency was introduced. Authentication motion stays within the existing design-language behavior and respects the existing reduced-motion foundation.

## Business logic changes

This phase adds identity/security logic, not accounting business logic. The account lifecycle is explicit and institution-scoped. Approval is server-authoritative and permission-protected.

`CHANGES_REQUESTED` is represented in the lifecycle, but editing/resubmitting only requested fields belongs to the later resident/user-management implementation. That behavior is deferred explicitly rather than silently omitted.

## Security changes

- PBKDF2-SHA256 with random salts and 600,000 iterations;
- constant-time password/OTP hash comparison;
- opaque random sessions with only token hashes persisted;
- HttpOnly/SameSite Web cookies and Secure outside local development;
- Flutter OS-backed secure token storage;
- explicit expiry/revocation and password-reset all-session invalidation;
- D1-backed login throttling;
- OTP expiry, attempt limits, request limits, outstanding-challenge invalidation, and replay rejection;
- audit evidence for successful/failed/rate-limited login and security-sensitive authentication state changes;
- raw passwords and raw submitted IP values are not written to audit metadata;
- development-only bootstrap/verification aids require both development environment and a local hostname.

## Performance changes

No authentication ORM, JWT framework, or Node-only crypto package was introduced. Web Crypto and prepared D1 statements keep the Worker dependency/runtime surface small.

Permission resolution is intentionally simple for the foundation. Later permission-heavy phases should profile and index/cache only from measured need, without making client-side permission data authoritative.

## Memory changes

Authentication correctness does not depend on process-local mutable memory. Sessions, throttling, challenges, and account state are persisted in D1 so Worker isolate replacement does not reset security state.

## Tests added

- password hashing/verification and crypto primitive tests;
- OTP generation/hash/validation tests;
- existing API foundation tests remain active;
- Flutter secure authentication entry widget test;
- local D1 migration/schema verification;
- full local authentication runtime smoke test covering bootstrap, login, OTP/replay rejection, registration, verification, approval, password reset/session invalidation, relogin, session listing, and revocation.

## CI verification

Phase 04 implementation verification run `33268045449` executes the complete permanent CI gate: locked dependency installation, formatting, lint, TypeScript/Worker bindings, unit tests, D1 verification, authentication runtime smoke, Web/API builds, Flutter analysis/tests, Android debug build, and iOS no-codesign compile.

A documentation-closure commit is also required to pass the same permanent CI before the Phase 04 pull request is presented for acceptance.

## Local verification

The runnable checkpoint uses the same code paths as CI:

```bash
corepack enable
corepack prepare pnpm@11.23.0 --activate
pnpm install --frozen-lockfile
pnpm db:verify:local
pnpm --filter @boardops/api dev
```

Then, from another terminal:

```bash
pnpm auth:smoke:local
pnpm --filter @boardops/web dev
```

Flutter can be checked with:

```bash
bash scripts/bootstrap-mobile.sh
cd apps/mobile
flutter run
```

Exact branch/update commands are also documented in the README.

## Known limitations

- no production authentication email provider is provisioned;
- authenticator-app 2FA/recovery codes are not yet implemented;
- full role/permission administration is Phase 05;
- `CHANGES_REQUESTED` field-edit/resubmission UI is deferred;
- phone/mobile-number identity and login are not implemented in this baseline;
- approximate device geolocation is not implemented;
- advanced institution-configurable password policy/history/expiry is deferred;
- production Cloudflare resources remain unprovisioned.

## Deferred items

Profile/R2 behavior, notification delivery, complete permission management, advanced 2FA/recovery, production operations, and the remaining business modules continue in their designated roadmap phases. These are documented deferrals, not removed requirements.

## Exit criteria

- implementation complete for Phase 04 scope: **YES**;
- tests added: **YES**;
- architecture/security documentation updated: **YES**;
- D1 migrations added and verified locally in CI: **YES**;
- Web build: **PASS**;
- API build/type/runtime smoke: **PASS**;
- Flutter analyze/tests: **PASS**;
- Android build: **PASS**;
- iOS compile: **PASS**;
- previous foundation behavior preserved: **YES**;
- permanent CI must be green on the final documentation-closure head before PR acceptance.

## Final status

RUNNABLE — TEST NOW.
