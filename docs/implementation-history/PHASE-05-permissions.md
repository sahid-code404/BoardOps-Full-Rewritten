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

## Feature parity disposition

- **CORRECTED — authorization model:** legacy hardcoded role-name checks are replaced by backend-authoritative permission evaluation.
- **REFINED — role administration:** useful role concepts are preserved while role membership and role permissions become institution-scoped, reasoned, audited, and step-up protected.
- **REFINED — per-user access:** direct ALLOW/DENY overrides are supported with deterministic DENY precedence and effective-access visibility.
- **PRESERVED/REFINED — resident approval:** the existing approval capability remains, but its authorization now consumes the canonical `resident.approve` permission guard.
- **REFINED — Web administration UX:** access administration is exposed through the shared BoardOps design language rather than legacy framework code.
- **DEFERRED — destructive role deletion and break-glass recovery:** both require explicit lifecycle/recovery policy before implementation.

Nothing in this phase silently removes the accepted permission-related behavior from the product baseline.

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
- end-to-end role inheritance, denied actions, direct DENY, direct ALLOW, step-up protection, auditing, and self-lockout prevention.

The existing authentication smoke remains first in the combined local/CI authorization smoke so Phase 04 behavior is regression-tested before Phase 05 behavior.

## API contract

The API remains under `/api/v1`. Phase 05 adds permission catalog, roles, and user-access endpoints. The OpenAPI 3.1 contract and API documentation were updated in the same phase.

## Performance and memory

No new runtime dependency is introduced. Permission resolution uses prepared D1 queries and indexed join/override tables. No process-local authorization cache is used, avoiding stale permissions after an administrator changes access.

## Security

Backend authorization remains authoritative. Permission mutations are online-only, scoped to institution, step-up protected, reasoned where required, and audited. The system does not infer authorization from role names.

## Verified implementation CI

GitHub Actions run `33270319964` passed:

- locked dependency installation;
- formatting and lint;
- TypeScript and Wrangler binding generation;
- Web/API unit tests;
- D1 migration verification;
- authentication plus permission end-to-end smoke;
- Web/API builds;
- Flutter analyze and tests;
- Android debug APK build;
- iOS no-codesign compile validation.

## Local runtime checkpoint

Use the commands in the repository `README.md`. The required manual checkpoint is the authenticated Web Access Control workspace at `/permissions`, plus the combined local smoke test.

## Known limitations / deferred work

- destructive role deletion is intentionally deferred pending an explicit lifecycle/reference policy;
- break-glass/recovery administration is deferred to security/system-administration hardening;
- the final Web/Flutter application shell and permission-aware navigation belong to Phase 06;
- later domain modules still need to bind their business actions to the canonical permission codes as those routes are implemented.

## Exit criteria

Phase 05 implementation gates are green. Local runtime review remains the human acceptance gate before Phase 05 is merged and Phase 06 begins.

## Final status

RUNNABLE — TEST NOW
