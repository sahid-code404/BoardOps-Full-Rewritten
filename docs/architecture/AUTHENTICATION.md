# Authentication Architecture — Phase 04

## Purpose

Phase 04 adds the first end-to-end BoardOps identity and session boundary on top of the Phase 03 Cloudflare backend foundation. The implementation covers the master Phase 04 scope: Web, Flutter, backend authentication, account approval, sessions, and OTP step-up verification.

Authentication is authoritative in the Worker API. Web and Flutter are clients of the same `/api/v1/auth` contract and do not maintain a second authentication rule set.

## Identity and account lifecycle

Registration is institution-scoped and uses the stable `institution_user_id` field. Its display label remains institution-configurable, so the same field may be presented later as Student ID, Roll Number, Employee ID, Hostel ID, Registration Number, or another accepted label.

Phase 04 recognizes these account states:

- `PENDING_EMAIL_VERIFICATION`
- `PENDING_REVIEW`
- `CHANGES_REQUESTED`
- `APPROVED`
- `ACTIVE`
- `RESTRICTED`
- `SUSPENDED`
- `ARCHIVED`
- `REJECTED`

A newly registered user starts in `PENDING_EMAIL_VERIFICATION`. Successful email verification moves the account to `PENDING_REVIEW`. An authorized reviewer can approve, reject, or request changes. Approval records an `APPROVED` transition and then activates the account; the persisted user row ends in `ACTIVE` while the append-only state-event history preserves both transitions.

Review actions are protected by the `resident.approve` permission. Full role/permission administration belongs to Phase 05; Phase 04 only consumes the permission boundary needed to prove that approval is not implemented as `if ADMIN` logic.

## Password handling

Password credentials use Workers-compatible Web Crypto rather than Node-only crypto/filesystem assumptions.

- algorithm: PBKDF2 with SHA-256;
- default iteration count: 600,000;
- random per-password salt;
- 256-bit derived password value;
- constant-time byte comparison for password verification;
- password hashes and salts are stored in D1, never raw passwords.

The Phase 04 API enforces a 12–128 character password length boundary. The richer configurable password-policy system is intentionally deferred to the later settings/policy phase instead of being hardcoded into authentication.

## Login throttling and security audit

Login attempts use a D1-backed throttle window rather than process-local memory. Five failed attempts within fifteen minutes cause a fifteen-minute block for the hashed institution/identifier/IP attempt key.

Successful logins, failed credential checks, rate-limited attempts, logout, password reset, OTP activity, approval decisions, and session revocation create append-only audit evidence where applicable. Unknown-identity login failures use a derived attempt reference instead of persisting the raw submitted identifier or IP in audit metadata.

## Session model

BoardOps uses server-side revocable sessions. A cryptographically random session token is returned once and only its SHA-256 hash is stored in D1.

### Web

Web authentication uses the `boardops_session` cookie. It is `HttpOnly`, `SameSite=Lax`, scoped to `/`, and `Secure` outside local development. Browser JavaScript does not receive the raw session token in the JSON login response.

### Mobile

Mobile login uses a bearer token. Flutter stores the durable token and expiry through `flutter_secure_storage`, mapping to Android Keystore/iOS Keychain-backed platform storage rather than ordinary application preferences.

Web sessions currently expire after 30 days and mobile sessions after 60 days. Server-side revocation and expiry are checked on every authenticated request. Password reset revokes all existing sessions for the account.

The session list exposes session/device metadata needed for user-visible security controls: client type, optional device name, user agent, creation time, last activity, expiry, revocation state, and step-up verification time. Approximate city/region lookup is not implemented in Phase 04.

## OTP step-up verification

Phase 04 implements a 2FA-ready `STEP_UP` OTP challenge rather than claiming that authenticator-app 2FA is already complete.

- six numeric digits generated without modulo bias;
- five-minute expiry;
- maximum five invalid attempts;
- maximum five requests per fifteen-minute window;
- a new challenge consumes earlier outstanding challenges for the same user/purpose;
- consumed challenges cannot be replayed;
- successful verification records `step_up_verified_at_ms` on the current session;
- OTP comparison uses a challenge-bound SHA-256 digest plus constant-time comparison.

The production delivery provider is deliberately not implemented in this phase. Local development can expose the generated code only when both the environment is `development` and the request host is local. Staging/production never receive development-only code fields.

## Email verification and password reset

Registration creates a short-lived email-verification credential and password reset creates a separate short-lived reset credential. Stored credential tables contain hashes rather than directly queryable raw tokens. Successful verification/reset consumes the credential so it cannot be replayed.

Phase 04 creates outbox intent for future notification delivery, but the actual email provider is a later notifications/email phase. Local-only development responses allow the end-to-end authentication flow to be verified before a real provider exists.

Password-reset requests return a generic accepted response so callers cannot use the endpoint to enumerate accounts. Reset confirmation replaces the password credential and revokes all previously active sessions.

## Web experience

The React/Vite application provides:

- sign-in;
- registration;
- email-verification completion;
- pending/review-state handling;
- password-reset request/confirmation;
- account/session view;
- session revocation;
- OTP step-up controls.

The screens reuse the shared BoardOps design language and `/api` development proxy. Authentication is routed under `/auth` and account security under `/account`.

## Flutter experience

The Flutter application provides the same authentication entry point and account/security behavior through Riverpod-controlled state and the shared versioned API. The mobile client never stores the durable bearer token in `SharedPreferences` or another ordinary preference store.

`flutter_secure_storage` is pinned to `10.3.1` because that is the version verified with the Phase 04 Flutter 3.47.1 Android/iOS CI toolchain. The previously proposed 11.x line is not used by this phase.

## D1 migrations

`0002_authentication_foundation.sql` adds the authentication data model: users, append-only account-state events, password credentials, sessions, email-verification/reset credentials, OTP challenges, authentication-attempt windows, and the role/permission tables required by the approval boundary.

`0003_authentication_step_up.sql` adds the session step-up verification timestamp and supporting index.

Migrations remain additive after the Phase 03 foundation and are re-applied from a fresh local D1 database by CI.

## Development-only bootstrap

`POST /api/v1/dev/bootstrap` exists only when `BOARDOPS_ENV=development` and the request host is local. It seeds a local demo institution and administrator for smoke/manual testing. In staging or production the route responds as not found.

Development verification/reset/OTP values follow the same local-only rule. They are testing aids, not a production delivery mechanism.

## Deferred without silent removal

The following richer product ideas are preserved as later work rather than falsely marked complete in Phase 04:

- full role/permission management UI and permission administration — Phase 05;
- editing and resubmitting only requested registration fields after `CHANGES_REQUESTED` — resident/user management phase;
- profile-photo upload and R2 lifecycle — operational files/user-profile phases;
- real email provider and authentication notifications — notifications/email phase;
- authenticator-app 2FA, recovery-code lifecycle, and policy-driven 2FA enforcement;
- institution-configurable advanced password history/expiry/complexity policy;
- phone/mobile-number identity and sign-in;
- approximate session geolocation;
- production Cloudflare resource provisioning.

These deferrals do not weaken the Phase 04 security boundary: protected operations remain server-authoritative and unauthenticated/unauthorized requests are rejected.

## Verification

CI starts the Worker against local D1, applies all migrations, and runs a real authentication smoke sequence covering local bootstrap, admin login, OTP verification and replay rejection, resident registration, email verification, approval, resident login, password reset with old-session invalidation, session listing, and explicit session revocation. The normal format, lint, TypeScript, unit-test, Web/API build, Flutter analyze/test, Android build, and iOS compile gates remain mandatory.
