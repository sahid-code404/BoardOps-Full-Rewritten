# Security Problems / Target Controls

## Critical source findings

### S-01 — Committed real-environment file risk
The legacy repository tree includes a committed `.env`. Values were intentionally not reproduced in this audit. Any real credentials ever committed must be considered exposed and rotated outside this repository.

**Target:** commit only `.env.example`; use Cloudflare/GitHub/CI secret stores. Add secret scanning and ignore rules.

### S-02 — Node filesystem rate limiter
Legacy `rate-limit.ts` reads/writes `/tmp/boardops-rate-limit.json` using Node `fs` and a process-local throttle. This is incompatible with the intended Cloudflare Worker architecture and cannot provide globally coherent abuse protection across isolates.

**Target:** Cloudflare Rate Limiting/service-native protection keyed by trusted client identity/IP/action, plus route-specific policies and audit telemetry.

### S-03 — Node crypto/runtime coupling
Legacy auth uses Node `crypto`, synchronous `scryptSync`, `Buffer`, and long-lived raw opaque session tokens stored in the database.

**Target:** Workers-compatible audited password-hashing/session design. Prefer Web Crypto where appropriate; do not invent crypto. Store only appropriately protected/token-hashed session material when feasible, rotate/revoke sessions, and document expiry/device behavior.

### S-04 — Authorization by role string
Routes use `requireRole("ADMIN")`; UI also checks ADMIN/SUPER_ADMIN. This is not granular permission enforcement.

**Target:** permission middleware/domain guard backed by one authorization source; tests prove denied actions cannot be called directly.

### S-05 — Missing institution scoping
Without institution keys on all business records and scoped repository methods, future data mixing/leakage is easy.

**Target:** institution boundary enforced in schema, repositories, search, file authorization, events, reports, and tests.

## Additional target controls

- Secure HttpOnly/Secure/SameSite cookie strategy on web; no auth tokens in localStorage.
- Android Keystore/iOS Keychain secure storage on mobile.
- OTP expiry, attempt limits, replay protection, resend throttling.
- 2FA secret protection and one-time backup-code consumption.
- CSRF strategy appropriate to cookie authentication.
- CORS restricted to accepted origins.
- Content Security Policy and modern security headers for web.
- Upload content/size/type validation; authorized R2 access; randomized object keys; malware scanning policy if risk requires it.
- Structured safe API errors; no stack traces or secrets to clients.
- PII minimization in logs/audit; audit itself remains immutable.
- Request/operation idempotency for money-changing endpoints.
- Dependency/security scanning in CI.
- Backup/recovery procedures for D1/R2 and historical financial reconstruction.

Security controls are verified in integration tests, not inferred from hidden buttons.