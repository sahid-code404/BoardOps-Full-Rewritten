# Database Inventory / Migration Audit

## Legacy database shape

The read-only source uses Prisma with a local SQLite database. The schema contains concepts for users/sessions/login history; roles/permissions; meal configuration/entries/guest meals/holidays; billing cycles/snapshots/bills; payments/refunds/adjustments/ledger; expenses/purchases/items; variables/formulas/policies; restrictions; notifications/audit; and additional peripheral concepts such as leave/staff-related records.

The model is useful as a concept inventory, not a target schema.

## Critical structural gaps

1. **Money types:** authoritative financial fields use floating point (`Float`) rather than integer minor units.
2. **Institution isolation:** business tables do not consistently carry an institution/workspace foreign key, so target isolation cannot be inherited safely.
3. **Authorization duplication:** fixed `User.role` string logic coexists with Role/Permission/RolePermission models, producing competing authorization authorities.
4. **Finance deletion:** bills/payments/expenses and other records have soft-deletion/deletion-queue concepts inconsistent with immutable authoritative financial history.
5. **Cascade risk:** legacy cascading relations are not automatically acceptable for audit/financial records.
6. **Idempotency:** important financial helpers rely on read-before-write checks rather than database uniqueness keys designed for concurrent retries.
7. **Ledger concurrency:** running balance is stored per entry and computed from the latest row without an explicit serialization/optimistic-concurrency design.
8. **Historical membership:** billing often infers resident eligibility from current role/status/created time rather than a first-class institution membership/service timeline.
9. **File storage:** payment proofs/receipts/avatars need explicit R2 object metadata/ownership instead of local/implicit upload behavior.
10. **Outbox/workflow state:** target async consistency needs durable outbox/idempotency/workflow records suitable for Queues/Workflows.

## Target D1 conceptual families

- institution / institution_setting / policy / reference-sequence
- user / institution_membership / profile / credential-verification / session / login-event
- role / permission / role-permission / user-permission-or-assignment according to final DEC-018 interpretation
- meal-definition / meal-service-rule / meal-booking / guest-meal / holiday / admin-override
- product / purchase / purchase-item / expense / expense-category
- variable-definition / variable-version / formula-definition / formula-version
- resident-fund ledger / bill / bill-line / payment / refund / adjustment
- restriction / exemption / restriction-event
- billing-cycle / monthly-snapshot / snapshot-input / close-workflow state
- notification / announcement / delivery-attempt
- audit-event / activity-timeline-event / domain-outbox
- file-object metadata referencing R2 keys
- idempotency-key / operation result where needed

## D1 migration requirements

- Integer minor-unit columns for money.
- Foreign keys and institution isolation on every scoped record.
- Unique constraints for references, idempotency keys, one-effective-state invariants, and deduplicated financial effects.
- Explicit indexes for institution + status/date/search filters.
- Append-only financial/audit facts where required.
- No hard-delete path for authoritative finance.
- Schema migration tests and historical reconstruction tests.
- Recovery procedure for failed migration/close.

No Prisma schema, local SQLite file, or backup from the source is copied into the target repository.
