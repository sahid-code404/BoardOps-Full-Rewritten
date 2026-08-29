# ADR-016 — Permission-Based Authorization

## Status

Accepted in Phase 05.

## Context

BoardOps will expose financial, operational, resident, configuration, reporting, and audit actions to different authorized people inside one institution. The legacy implementation relied on hardcoded role checks in places, while the accepted BoardOps specification explicitly requires permission-based backend authorization.

Role names such as `Administrator` are useful for administration and communication but are too coarse to be the security contract for business actions. Role names also make later customization difficult and encourage clients to duplicate authorization assumptions.

## Decision

BoardOps authorization uses canonical permission codes as the action contract.

A user's effective permission set is derived from:

1. permissions inherited from institution-scoped roles;
2. direct user `ALLOW` overrides;
3. direct user `DENY` overrides, which take precedence over every allow source.

Backend routes enforce required permission codes through shared guards. Clients may use the same permission codes to hide or disable unavailable interactions, but client visibility never replaces backend enforcement.

Access-control mutations require `permissions.manage` and recent step-up verification. Role-membership and direct-override changes require an explicit reason and append audit evidence.

System roles are immutable through the general role editor. Cross-institution role assignment is rejected. The API also prevents a permission manager from accidentally removing their own effective `permissions.manage` access through ordinary self-service changes.

## Consequences

### Positive

- business routes depend on stable action permissions rather than UI roles;
- institutions can build reusable custom roles without changing backend code;
- explicit DENY provides a predictable exception mechanism;
- Web and Flutter can consume the same authorization vocabulary;
- access changes remain auditable and explainable;
- later modules can add guards without duplicating authorization logic.

### Costs

- permission changes require careful migration and catalog maintenance;
- effective permissions must be re-evaluated from authoritative data;
- direct overrides can become difficult to reason about if overused, so roles remain the preferred mechanism;
- recovery/break-glass administration needs a separate later policy.

## Rejected alternatives

### Hardcoded role-name checks

Rejected because `if ADMIN` couples product actions to organizational labels and violates the accepted permission philosophy.

### Client-only authorization

Rejected because hidden buttons are not a security boundary and mobile clients may be old or modified.

### Direct permissions only, no roles

Rejected because repeated user-by-user assignment is operationally expensive and difficult to audit at institutional scale.

### ALLOW overrides only

Rejected because explicit exceptions sometimes need to remove one inherited capability without cloning an entire role. A direct DENY is clearer and has deterministic precedence.
