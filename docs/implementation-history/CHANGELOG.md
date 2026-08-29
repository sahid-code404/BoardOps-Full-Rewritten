# BoardOps Change Log

## Unreleased

### Phase 05 — Permissions

- Added `permissions.read` and `permissions.manage` to the canonical permission catalog plus D1 indexes for role lookup, role-permission lookup, user-role membership, and direct permission overrides.
- Centralized effective-permission resolution so role inheritance and direct overrides share one authoritative backend implementation; explicit `DENY` wins over inherited or direct `ALLOW`.
- Added reusable exact/all/any backend permission guards and a permission + recent STEP_UP guard for high-risk access mutations.
- Refactored registration review to use the centralized permission guard instead of the Phase 04 transitional helper.
- Added institution-scoped permission catalog, role management, user access, role-membership, and direct-override API routes.
- Added immutable system-role handling, cross-institution role rejection, canonical permission validation, mandatory reasons, audited access mutations, and self-lockout prevention.
- Added a responsive Web Access control workspace with role editing, user role assignment, direct ALLOW/DENY/INHERIT overrides, and step-up verification.
- Added Flutter canonical permission constants, exact/all/any policy helpers, fail-closed ACTIVE-account checks, a reusable visibility gate, and a route redirect helper.
- Expanded the OpenAPI v1 contract for all Phase 05 permission endpoints and documented ADR-016 plus the authorization architecture.
- Added unit and end-to-end permission tests covering inherited access, denied actions, direct DENY precedence, direct ALLOW, STEP_UP enforcement, and self-lockout protection.
- Kept destructive role deletion, break-glass recovery, final app-shell navigation, and later business-action wiring explicitly deferred to their roadmap phases.

### Phase 04 — Authentication foundation

- Added D1 authentication migrations for users, account-state history, password credentials, sessions, verification/reset credentials, OTP challenges, login-attempt throttling, and role/permission foundations.
- Added institution-scoped registration with stable Institution User ID, email verification, pending review, approval, rejection, and request-changes lifecycle states.
- Added PBKDF2-SHA256 password hashing through Web Crypto with random salts, 600,000 iterations, and constant-time credential comparison.
- Added D1-backed login throttling and audit evidence for successful, failed, and rate-limited authentication attempts without logging submitted passwords or raw IP values.
- Added server-side revocable sessions with HttpOnly Web cookies and mobile bearer-token support.
- Added session/device listing, logout, targeted revocation, password-reset all-session invalidation, and audit events for security-sensitive session actions.
- Added bounded five-minute `STEP_UP` OTP challenges with request/attempt limits and replay prevention.
- Added permission-protected registration review using `resident.approve` rather than hardcoded role names.
- Added React/Vite authentication, password-reset, account-security, OTP, and session-management UI.
- Added Flutter authentication/account-security flows using Riverpod, Dio, and OS-backed secure token storage.
- Pinned `flutter_secure_storage` to 10.3.1 after native CI compatibility verification with Flutter 3.47.1; the previously proposed 11.x version is not used.
- Expanded the OpenAPI v1 authentication contract and API architecture documentation.
- Added a real local authentication smoke flow covering bootstrap, login, OTP/replay rejection, registration, verification, approval, password reset, relogin, session listing, and revocation.
- Verified the Phase 04 implementation gates in GitHub Actions run `33268045449` before documentation closure.
- Kept real email delivery, authenticator-app 2FA, full permission administration, profile/R2 behavior, and production Cloudflare provisioning explicitly deferred to their later phases.

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
