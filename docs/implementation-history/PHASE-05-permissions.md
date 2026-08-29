# PHASE 05 — Permissions

## Objective

Replace role-name authorization assumptions with one institution-scoped permission engine shared by backend, Web, and Flutter.

## Requirements implemented

- canonical role → permission → action authorization model;
- reusable backend permission guards;
- exact/all/any permission policies;
- direct user ALLOW/DENY overrides with DENY precedence;
- institution-scoped role and user-access administration;
- high-risk permission changes protected by recent STEP_UP verification;
- mandatory reasons for role membership and direct user overrides;
- audit evidence for permission mutations;
- Web permission administration workspace;
- Flutter permission-policy/visibility/route-guard primitives;
- end-to-end allowed/denied action verification.

## Database changes

Migration `0004_permissions_engine.sql`:

- adds `permissions.read`;
- adds `permissions.manage`;
- adds indexes for role lookup, role-permission lookup, role membership, and direct permission overrides.

The Phase 04 role/permission tables remain authoritative; Phase 05 extends them rather than creating a parallel authorization model.

## Backend changes

Added `services/api/src/permissions` containing:

- canonical permission codes;
- effective-permission resolver;
- direct override precedence;
- reusable authorization guards;
- permission request validation;
- permission catalog/self-access routes;
- role management routes;
- user role/direct-override routes.

Authentication session resolution now consumes the shared effective-permission resolver. Registration review now consumes the centralized Phase 05 guard rather than its Phase 04 transitional permission helper.

## Action authorization

Permission checks fail closed when:

- no valid session exists;
- the account is not ACTIVE;
- the required permission is missing;
- a high-risk mutation lacks a recent STEP_UP verification.

Role and direct-grant mutations are scoped to the authenticated institution. Direct DENY wins over inherited and direct ALLOW sources.

## Safety rules

- system roles cannot be edited through the custom-role endpoint;
- user role assignment rejects cross-institution roles;
- permission codes must exist in the canonical database catalog;
- access mutations are audited;
- membership/override mutations require reasons;
- an actor cannot remove their own effective `permissions.manage` through ordinary self-service changes;
- no offline role/permission mutation is introduced.

## Web changes

Added `/permissions` with the established BoardOps glass design language:

- catalog/role/user KPIs;
- step-up verification panel;
- role inspector and custom-role editor;
- user role membership editor;
- direct ALLOW/DENY/INHERIT editor;
- effective access summaries;
- permission-aware entry point from the account screen.

Client visibility remains convenience only. Backend guards are authoritative.

## Flutter changes

Added:

- canonical permission constants;
- exact/all/any permission evaluators;
- ACTIVE-account fail-closed behavior;
- `PermissionGate` visibility primitive;
- route redirect helper;
- deterministic policy tests.

The full permission administration workspace is not duplicated on Flutter in this phase because Phase 06 establishes the shared application shell/navigation first. The policy primitives are ready for that shell and later business modules.

## Tests

Added/updated verification for:

- effective permission merging;
- DENY precedence;
- deterministic sorting/deduplication;
- backend exact/all/any guards;
- inactive-account denial;
- five-minute step-up freshness;
- Web permission visibility helper;
- Flutter permission policy/redirect behavior;
- D1 Phase 05 permission catalog/index presence;
- end-to-end role inheritance, denied actions, direct DENY, direct ALLOW, step-up protection, and self-lockout prevention.

The existing authentication smoke remains first in the combined local/CI authorization smoke so Phase 04 behavior is regression-tested before Phase 05 behavior.

## API contract

The API remains under `/api/v1`. Phase 05 adds permission catalog, roles, and user-access endpoints. The OpenAPI contract is updated as part of the Phase 05 closure gate.

## Performance and memory

No new runtime dependency is introduced. Permission resolution uses prepared D1 queries and indexed join/override tables. No process-local authorization cache is used, avoiding stale permissions after an administrator changes access.

## Security

Backend authorization remains authoritative. Permission mutations are online-only, scoped to institution, step-up protected, reasoned where required, and audited. The system does not infer authorization from role names.

## Known limitations / deferred work

- destructive role deletion is intentionally deferred pending an explicit lifecycle/reference policy;
- break-glass/recovery administration is deferred to security/system-administration hardening;
- the final Web/Flutter application shell and permission-aware navigation belong to Phase 06;
- later domain modules still need to bind their business actions to the canonical permission codes as those routes are implemented.

## Exit criteria

Phase 05 is complete only after formatting, lint, TypeScript, unit tests, D1 migration verification, authentication + permission E2E smoke, Web/API builds, Flutter analyze/tests, Android build, iOS compile, documentation, and local runtime testing pass.

## Final status

NOT READY — CONTINUE FIXING until the final Phase 05 CI and local runtime checkpoint are green.
