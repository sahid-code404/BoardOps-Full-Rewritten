# BoardOps API Contract

Canonical API prefix: `/api/v1/`.

`packages/api-contract/openapi/boardops-v1.yaml` is the OpenAPI 3.1 source of truth. Phase 04 expands it from the health foundation to the complete authentication surface: registration, email verification, login, current principal, logout, session inventory/revocation, password recovery, administrator registration review, and bounded OTP step-up verification.

## Authentication transports

Web clients use the `boardops_session` secure HttpOnly cookie and call the API with credentials included. The session secret is intentionally unavailable to browser JavaScript. Mobile clients receive an opaque bearer session token only when `clientType` is `MOBILE`; the Flutter app persists that token only through OS-backed secure storage.

Both transports resolve to the same server-side session record and principal. Session revocation, expiry, account state, and permission checks are authoritative on the backend.

## Authentication lifecycle

Registration is institution-scoped and begins in `PENDING_EMAIL_VERIFICATION`. Successful email verification moves the account to `PENDING_REVIEW`. A caller holding `resident.approve` may approve, reject, or request changes. Approved registrations become `ACTIVE` and can perform operations allowed by their effective permissions.

Password-reset request responses are deliberately generic to reduce account enumeration. A successful reset consumes the reset token and revokes existing sessions.

OTP in Phase 04 is a bounded `STEP_UP` challenge for an already authenticated active account. Codes expire after five minutes, have an attempt limit, are single-use, and are stored only as challenge-bound hashes. Successful verification records the step-up timestamp on the current session so later permission-sensitive features can require recent proof without redesigning authentication.

Local development may return development-only verification/reset/OTP material when the Worker is running with `BOARDOPS_ENV=development` on localhost. These fields are optional in the contract and must not appear in staging or production.

## Compatibility and errors

Errors use `{ "error": { "code", "message", "requestId", "details?" } }`. Raw SQL, stack traces, password data, session tokens, OTP codes, and internal runtime details must never cross error or audit boundaries.

Compatibility matters because older mobile binaries may remain installed while the backend evolves. Breaking changes require a version/deprecation plan rather than silently changing v1 semantics. Any material route or response change must update the OpenAPI file and contract documentation in the same phase.
