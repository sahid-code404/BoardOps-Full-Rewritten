# Accounting Rules Audit

## Legacy observations

The old schema and finance helpers use `Float`/JavaScript `number` for bills, payments, expenses, purchases, refunds, adjustments, ledger entries, and related calculations. Bill generation and monthly closing use arithmetic/rounding over these values. The resident fund stores ledger `runningBalance` values and derives the visible balance from the latest entry.

The legacy code has a real ledger concept and attempts to centralize bill generation, both of which are valuable. However, correctness gaps are material:

- Bill-generation comments explicitly allow some side effects to run outside a caller transaction and describe possible rollback orphans as harmless. Financial orphans are not harmless.
- Payment approval updates payment state, then separately creates ledger credit, syncs bill, checks restrictions, notifies, and audits.
- Rejecting an approved payment creates a reversing adjustment, but the observed VOID path does not create an equivalent ledger reversal before resyncing the bill.
- The observed payment DELETE path schedules deletion and resyncs a bill but does not first reverse the already-approved deposit ledger credit.
- Approved unlinked payment amount edits are not fully protected from ledger desynchronization.
- Bill-settlement idempotency is implemented as read-then-insert without a database uniqueness guarantee, so concurrent calls can race.
- New ledger balance is computed from the latest row without locking/serialization; concurrent credits/debits can write inconsistent running balances.
- Negative running balances can be produced and later displayed as `max(0, value)`, masking rather than preventing DEC-032 violations.

## Target accounting invariants

1. Store authoritative money in integer minor units.
2. Ledger financial facts are immutable and append-only.
3. Resident available fund never becomes negative in the committed financial model.
4. Outstanding due is separate liability, including previous/current split.
5. Every approved financial transaction is immutable; correction = reversal/adjustment.
6. Closed/snapshotted source records are immutable.
7. Money commands are idempotent under concurrency using unique keys/constraints, not only pre-read checks.
8. Domain mutation + ledger + outbox/audit intent share a consistency boundary.
9. Historical bill calculation is reproducible from snapshots.
10. Permanent deletion of authoritative financial history is prohibited.
11. Rounding/conversion policy is centralized and deterministic.
12. Reconciliation tests prove ledger totals, fund state, bills, refunds, and snapshot results agree.

The legacy financial data model must therefore be conceptually migrated, not mechanically ported.
