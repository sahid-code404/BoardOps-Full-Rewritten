# BoardOps Permission Authorization

## Phase

Phase 05 — Permissions.

## Authority model

BoardOps authorization is permission-based rather than role-name based:

```text
Authenticated user
      ↓
Institution-scoped roles
      ↓
Role permission assignments
      +
Explicit user overrides
      ↓
Effective permission set
      ↓
Backend action guard
```

A role is a reusable bundle of permissions. It is not itself authorization evidence. Sensitive API routes check the current effective permission set on the backend for every authenticated request.

## Effective-permission precedence

The canonical rule is:

1. collect permissions inherited from every role assigned to the user;
2. add explicit direct `ALLOW` overrides;
3. remove every permission with an explicit direct `DENY` override;
4. return a deterministic unique set.

`DENY` therefore wins over both role inheritance and direct allow. `INHERIT` is an API mutation instruction that removes a direct override and returns control to role inheritance.

## Institution isolation

Roles belong to one institution. User role assignments accept only role IDs belonging to the authenticated actor's institution. User-access lookups are also institution-scoped. A role from another institution cannot be assigned by guessing its ID.

## Canonical permissions

Phase 04 established the business permission catalog. Phase 05 adds the administration permissions:

- `permissions.read` — inspect permission catalog, roles, and user access;
- `permissions.manage` — create/update custom roles, assign role membership, and set explicit user overrides.

Existing business permission codes remain stable because later modules will consume them as action policies rather than inventing role checks.

## Guards

`services/api/src/permissions/guards.ts` is the reusable action-authorization boundary. It supports:

- one required permission;
- all-of permission policies;
- any-of permission policies;
- permission plus recent step-up verification.

All permission guards fail closed when the account is not `ACTIVE`, authentication is missing, or the required permission is absent.

Frontend visibility is only a convenience. React and Flutter may hide controls that the user cannot use, but a hidden button is never treated as security enforcement.

## High-risk access mutations

Changes to role definitions, role membership, and direct user overrides require:

1. an authenticated ACTIVE account;
2. `permissions.manage`;
3. a successful STEP_UP OTP on the current session within the last five minutes;
4. institution-scoped validation;
5. an audit record.

Role-membership changes and direct overrides also require a human-readable reason. This keeps access-control exceptions explainable months later.

## System roles

System roles can be inspected and assigned but cannot be edited through the general role editor. This prevents an administration screen from silently redefining a foundational system role.

Custom roles may be created and updated with an exact permission set. Role deletion is intentionally not exposed in Phase 05; destructive role lifecycle requires a later explicit policy for historical references and assigned users rather than an unsafe convenience endpoint.

## Self-lockout prevention

An actor cannot replace their own roles or direct overrides in a way that removes their own effective `permissions.manage` permission. This is a narrow operational safeguard, not a substitute for a future break-glass/recovery procedure.

## Audit evidence

Permission mutations append audit records using actions including:

- `permissions.role.created`;
- `permissions.role.updated`;
- `permissions.user_roles.replaced`;
- `permissions.user_override.changed`.

Reasons and changed identifiers are recorded where relevant. Existing audit tables remain append-only at the database layer.

## Web

The Web permission workspace is available at `/permissions` to users with `permissions.read` and provides:

- permission catalog visibility;
- institution role inspection;
- custom role creation/update;
- user role membership;
- direct `ALLOW` / `DENY` / `INHERIT` overrides;
- required reason fields;
- step-up verification before high-risk changes.

The account screen only shows the Access control entry point when `permissions.read` is present. The API independently enforces the same access.

## Flutter

Flutter Phase 05 introduces canonical permission constants, all/any/exact policy evaluation, a reusable `PermissionGate`, and a route-redirect helper. These are the guard primitives that Phase 06 app-shell navigation and later business modules will consume.

Role changes remain online-required; the mobile client must never queue an offline authorization mutation and assume it succeeded.

## Verification

Phase 05 verification includes:

- pure effective-permission precedence tests;
- backend guard and step-up freshness tests;
- Flutter permission-policy tests;
- Web permission visibility tests;
- D1 migration/index verification;
- end-to-end authorization smoke covering inherited role access, missing-permission denial, direct DENY precedence, direct ALLOW, step-up enforcement, and self-lockout prevention.

## Deferred

Phase 05 deliberately does not build the final application shell/navigation, resident-management workspace, business-domain routes, offline authorization mutation support, break-glass recovery, or a destructive role deletion workflow. Those belong to later roadmap phases.
