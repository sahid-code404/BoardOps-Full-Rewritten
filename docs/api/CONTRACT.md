# BoardOps API Contract

Canonical API prefix: `/api/v1/`.

`packages/api-contract/openapi/boardops-v1.yaml` is the OpenAPI 3.1 source of truth. Phase 04 established the authentication surface. Phase 05 extends the same versioned contract with permission catalog, role management, user-access inspection, role membership, and direct permission override endpoints.

## Authentication transports

Web clients use the `boardops_session` secure HttpOnly cookie and call the API with credentials included. The session secret is intentionally unavailable to browser JavaScript. Mobile clients receive an opaque bearer session token only when `clientType` is `MOBILE`; the Flutter app persists that token only through OS-backed secure storage.

Both transports resolve to the same server-side session record and principal. Session revocation, expiry, account state, and permission checks are authoritative on the backend.

## Authentication lifecycle

Registration is institution-scoped and begins in `PENDING_EMAIL_VERIFICATION`. Successful email verification moves the account to `PENDING_REVIEW`. A caller holding `resident.approve` may approve, reject, or request changes. Approved registrations become `ACTIVE` and can perform operations allowed by their effective permissions.

Password-reset request responses are deliberately generic to reduce account enumeration. A successful reset consumes the reset token and revokes existing sessions.

OTP is a bounded `STEP_UP` challenge for an already authenticated active account. Codes expire after five minutes, have an attempt limit, are single-use, and are stored only as challenge-bound hashes. Successful verification records the step-up timestamp on the current session.

Local development may return development-only verification/reset/OTP material when the Worker is running with `BOARDOPS_ENV=development` on localhost. These fields are optional in the contract and must not appear in staging or production.

## Permission authorization

Phase 05 API routes live under `/permissions`.

Read-only administration routes require `permissions.read`. High-risk role/access mutations require `permissions.manage` plus recent STEP_UP verification on the current session.

Effective permission calculation is backend-authoritative:

```text
role permissions
+ direct ALLOW overrides
- direct DENY overrides
= effective permissions
```

A direct `DENY` always wins. The `INHERIT` mutation value removes a direct override and allows role inheritance to decide the result.

Role/user operations are scoped to the authenticated institution. Role membership changes and direct overrides require a reason and append audit evidence. System roles cannot be edited through the custom role endpoint. Ordinary self-service mutations cannot remove the actor's own effective `permissions.manage` access.

The Phase 05 routes are:

- `GET /permissions/me`
- `GET /permissions/catalog`
- `GET /permissions/roles`
- `POST /permissions/roles`
- `PUT /permissions/roles/{roleId}`
- `GET /permissions/users`
- `GET /permissions/users/{userId}`
- `PUT /permissions/users/{userId}/roles`
- `PUT /permissions/users/{userId}/grants/{permissionCode}`

Frontend permission visibility is a convenience only; every protected action is independently checked by the API.

## Compatibility and errors

Errors use `{ "error": { "code", "message", "requestId", "details?" } }`. Raw SQL, stack traces, password data, session tokens, OTP codes, and internal runtime details must never cross error or audit boundaries.

Permission-specific failures include stable codes such as `PERMISSION_DENIED`, `STEP_UP_REQUIRED`, `UNKNOWN_PERMISSION`, `ROLE_SCOPE_INVALID`, `SYSTEM_ROLE_IMMUTABLE`, and `SELF_LOCKOUT_PREVENTED` where applicable.

Compatibility matters because older mobile binaries may remain installed while the backend evolves. Breaking changes require a version/deprecation plan rather than silently changing v1 semantics. Any material route or response change must update the OpenAPI file and contract documentation in the same phase.
