# Logic / Correctness Problems Found in Legacy Reference

Severity reflects migration risk, not criticism of the old code.

## Critical

### L-01 — Floating-point authoritative money
Financial models/calculations use Prisma `Float` and JavaScript `number`. This violates the target integer-minor-unit invariant and can create rounding/reconciliation drift.

**Disposition:** CORRECTED. New D1 schema and accounting helpers use integer minor units with centralized rounding/conversion.

### L-02 — Financial side effects can escape transaction
The legacy bill-calculation helper explicitly notes that ledger/notification/bill-sync/reference helpers can run outside a caller transaction and can leave rollback orphans.

**Disposition:** CORRECTED. Domain mutation + financial ledger + outbox/audit intent must share a designed consistency boundary; external notifications consume committed outbox events.

### L-03 — Payment approval is a chain of independent writes
Payment state, ledger credit, bill synchronization, restriction lifting, notification, and audit happen sequentially. A crash can leave mismatched authoritative states.

**Disposition:** CORRECTED with atomic use case + idempotency + outbox.

### L-04 — Payment VOID/DELETE ledger mismatch
Observed APPROVED→REJECT creates a reversing ledger adjustment. Observed VOID and DELETE paths change status/bill contribution but do not equivalently reverse an existing deposit ledger credit. Resident fund can therefore retain money from a voided/deleted approved payment.

**Disposition:** CORRECTED. Approved finance is immutable; void is a compensating reversal. Authoritative payment is not permanently deleted.

### L-05 — Approved unlinked payment edit can desynchronize ledger
The legacy edit guard blocks amount changes for an approved payment only when linked to a bill. An approved unlinked deposit can be edited after its ledger credit was created.

**Disposition:** CORRECTED by DEC-033: approved financial transaction fields are immutable; adjustments replace edits.

### L-06 — Resident Fund nonnegative rule is only visually clamped
Legacy ledger creation can compute a negative running balance; account output later returns `Math.max(0, availableBalance)`. This hides a violated invariant rather than preventing it.

**Disposition:** CORRECTED transactionally; liability becomes due and ledger/fund remains valid.

### L-07 — Ledger running-balance race
`previousBalance` is read from the latest ledger row and a new running balance is calculated without demonstrated serialization/versioning. Concurrent writes can calculate from the same prior balance.

**Disposition:** CORRECTED using concurrency-safe ledger accounting/reconciliation. Running balance may be materialized only with a safe update strategy; immutable signed amounts remain authoritative.

### L-08 — Read-before-insert idempotency race
Bill settlement checks for an existing ledger row then inserts. Two concurrent retries can pass the check.

**Disposition:** CORRECTED with unique DB key and conflict-safe idempotency.

## High

### L-09 — Role/permission split brain
Schema has permission models, while runtime routes/UI materially use string role checks. Permission data can exist without being authoritative.

**Disposition:** CORRECTED to one backend permission engine.

### L-10 — Institution boundary absent/incomplete
Legacy business data is not consistently institution-scoped.

**Disposition:** CORRECTED in every target business aggregate/repository query.

### L-11 — Formula fallback can hide financial configuration failure
Monthly readiness describes missing/invalid meal formula as a warning and can fall back to legacy calculation. Silent fallback risks generating financially different results.

**Disposition:** REFINED to explicit policy. Financial close should fail closed unless a separately versioned fallback rule is deliberately configured and surfaced.

### L-12 — Historical eligibility inferred from current user fields
Legacy billing uses role/status/created time rather than a full membership/service history. Later status changes can distort old-period reconstruction.

**Disposition:** CORRECTED with institution membership/lifecycle effective dates or equivalent immutable historical facts.

### L-13 — Current-period/time assumptions
Use of `new Date()` and server-local date construction in legacy calculations is unsafe as a universal policy authority across timezone-configurable institutions.

**Disposition:** CORRECTED with institution timezone + server-authoritative time utilities.

## Medium

### L-14 — In-memory/persisted view router
Business navigation is represented by a Zustand view key instead of real URLs. Deep links/history/query-state behavior is weak.

**Disposition:** REPLACED with React Router.

### L-15 — Mixed deletion semantics
DELETED status, `deletedAt`, restore queues, and hard-deletion intent overlap in finance modules and can conflict with immutable history.

**Disposition:** Separate lifecycle archive from financial reversal; never hard-delete authoritative finance.

These findings are blockers against blind code migration.