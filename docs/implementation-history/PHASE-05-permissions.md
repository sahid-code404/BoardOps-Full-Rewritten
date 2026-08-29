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
- **REFINED — Web administration UX:** access administration is exposed through the shared BoardOps design language without copying the legacy framework implementation.
- **DEFERRED — destructive role deletion and break-glass recovery:** both require explicit lifecycle/recovery policy before implementation.

Nothing in this phase silently removes the accepted permission-related behavior from the product baseline.

## Reference visual parity correction

Human review found that the first rewrite presentation preserved the purple/graphite/glass palette but drifted too far from the accepted reference composition. This was treated as a parity defect rather than a new visual direction.

The audited reference commit `77f3dec3b264c42904207f27c5f008b33c03b868` was re-read specifically for presentation behavior. The relevant reference sources establish these visual rules:

- authentication is a centered `max-w-md` strong glass card, not a large marketing split-screen;
- the BoardOps mark and `Operations Suite` label live inside the authentication card;
- Sign in/Register uses a compact segmented glass navigation surface;
- forms use dense rounded glass inputs and rounded rectangular actions;
- the authenticated workspace uses a compact `max-w-6xl` glass chrome and dense cards rather than oversized landing-page typography;
- animated purple/blue/pink mesh ambience remains background treatment, not the primary content hierarchy.

Phase 05 therefore corrects the current Web surfaces by removing the split-screen authentication hero, restoring the centered reference-style authentication composition, reducing oversized page typography, tightening card density, and making Account/Access Control surfaces use the same compact glass rhythm. This is visual/interaction refinement only; the Phase 04/05 authentication and authorization security model remains unchanged.

The full reusable authenticated navigation shell, menu/search/theme/notification/profile chrome, responsive bottom navigation, and permission-aware navigation still belong to Phase 06. Those controls will not be faked in Phase 05 merely for visual similarity.

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

The corrected exact head `7fd5e673ede098b1aa1040327c141351b5c6fb69` passed pull-request GitHub Actions run `33271749245` across all Phase 05 gates:

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

This run verifies the permission implementation and the later reference visual-parity correction together on the exact reviewed head.

## Local runtime checkpoint

Use the commands in the repository `README.md`. The remaining human checkpoint is the corrected centered authentication surface plus authenticated `/account` and `/permissions` presentation, with the reference repository used as the visual baseline. The combined local authorization smoke must also remain green.

## Known limitations / deferred work

- destructive role deletion is intentionally deferred pending an explicit lifecycle/reference policy;
- break-glass/recovery administration is deferred to security/system-administration hardening;
- the full Web/Flutter application shell and permission-aware navigation belong to Phase 06;
- later domain modules still need to bind their business actions to the canonical permission codes as those routes are implemented.

## Exit criteria

Automated Phase 05 exit gates are green. Local human visual/interaction review is the remaining acceptance gate before PR #7 is merged and Phase 06 begins.

## Final status

RUNNABLE — TEST NOW
