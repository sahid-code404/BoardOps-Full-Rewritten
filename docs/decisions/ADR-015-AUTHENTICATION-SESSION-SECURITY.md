# ADR-015 — Authentication and Session Security

**Status:** Accepted for Phase 04

## Context

BoardOps needs one authentication model that works in Cloudflare Workers, React/Vite browsers, and the Flutter Android/iOS client. The model must support account approval, reliable revocation, device/session controls, OTP step-up verification, password reset, and future permission enforcement without depending on Node-only server assumptions or exposing durable secrets to ordinary client storage.

The legacy implementation cannot be treated as the security authority. Phase 04 therefore needs a clean Workers-compatible design that is explicit about where credentials live and how sessions are invalidated.

## Decision

BoardOps will use server-side D1-backed sessions with opaque random tokens.

1. Session tokens are generated with Web Crypto. Only a SHA-256 hash is stored in D1.
2. Web receives an `HttpOnly`, `SameSite=Lax` cookie that is `Secure` outside local development. The raw Web token is not returned to browser JavaScript in the login JSON body.
3. Mobile receives a bearer token and persists it only through OS-backed secure storage. Ordinary preferences are forbidden for durable authentication secrets.
4. Sessions have explicit expiry, last-seen state, revocation state/reason, client/device metadata, and an optional recent step-up verification timestamp.
5. Password reset revokes all active sessions for the user.
6. Passwords use PBKDF2-SHA256 through Web Crypto with a random salt and 600,000 iterations. Verification uses constant-time byte comparison.
7. Login throttling is persisted in D1 so it does not depend on a particular Worker isolate staying alive.
8. Phase 04 OTP is a bounded, expiring, replay-resistant `STEP_UP` challenge. Authenticator-app 2FA remains future work; the session model already has a step-up boundary for later sensitive operations.
9. Account approval consumes the permission engine boundary (`resident.approve`) rather than hardcoded role-name checks. Full permission administration is Phase 05.
10. Authentication decisions and security-sensitive state changes create append-only audit evidence. Unknown failed-login attempts use a derived attempt reference rather than recording the raw submitted identity/IP in audit metadata.
11. Development-only bootstrap and raw verification aids are allowed only when the environment is `development` and the request host is local. They must not be reachable in staging/production.

## Alternatives rejected

### Self-contained JWT-only sessions

Rejected as the default session model because immediate logout, password-reset invalidation, per-device listing, and targeted revocation would require additional server-side revocation infrastructure anyway. An opaque server-side session is simpler for the required BoardOps behavior.

### Web localStorage/sessionStorage tokens

Rejected because JavaScript-readable durable bearer tokens increase the consequence of XSS. Web uses an HttpOnly cookie instead.

### Mobile ordinary preferences

Rejected because the master security requirements explicitly require Android Keystore/iOS Keychain-backed storage for durable authentication secrets.

### Node crypto/filesystem authentication libraries

Rejected because the authoritative backend runs in Cloudflare Workers and must remain compatible with Web Crypto and Cloudflare runtime constraints.

### Process-memory login throttling

Rejected because Worker isolates are ephemeral and horizontally distributed. D1-backed throttling gives deterministic behavior for Phase 04; platform rate limiting can complement it during later security hardening.

### Plain stored OTP/session/reset values

Rejected for authoritative credential tables. Verification values are compared through hashes and consumed after use. Production notification delivery is a separate concern and must not weaken the credential-storage boundary when implemented later.

## Consequences

The design adds a D1 lookup to authenticated requests and requires explicit session cleanup/retention policy later, but it provides deterministic expiry/revocation, device controls, password-reset invalidation, and a clean permission-aware principal for later modules.

The chosen Flutter secure-storage package is pinned to the version actually proven against the Phase 04 Flutter toolchain rather than the previously proposed unverified major version. Future upgrades must pass Android and iOS build gates before the dependency matrix changes.
