# Locked Product Decisions

These decisions are carried from the supplied BoardOps specification. They are requirements unless a later explicit decision supersedes them.

| ID      | Locked decision                                                                                |
| ------- | ---------------------------------------------------------------------------------------------- |
| DEC-001 | Institution-based deployment model.                                                            |
| DEC-002 | Permission-based authorization.                                                                |
| DEC-003 | Variable-driven calculations.                                                                  |
| DEC-004 | Visual Formula Builder.                                                                        |
| DEC-005 | Resident Fund Account / running advance-fund model.                                            |
| DEC-006 | Excess balance is refunded after monthly settlement rather than silently carried forward.      |
| DEC-007 | Guest meal price is configurable.                                                              |
| DEC-008 | Low Balance Restriction Engine.                                                                |
| DEC-009 | Admin meal override requires a reason and auditability.                                        |
| DEC-010 | Billing schedule is configurable.                                                              |
| DEC-011 | Advance fund deposit model.                                                                    |
| DEC-012 | Historical bills preserve formula snapshots.                                                   |
| DEC-013 | Monthly financial snapshots.                                                                   |
| DEC-014 | Human-readable activity timeline in addition to technical audit.                               |
| DEC-015 | Resident approval uses Review → Approve / Reject / Request Changes.                            |
| DEC-016 | Registration uses Institution Name + Institution User ID; no hardcoded Student ID terminology. |
| DEC-017 | Identity-document upload excluded from v1.                                                     |
| DEC-018 | Permission-profile feature excluded from v1; avoid unnecessary role-profile UI.                |
| DEC-019 | Resident Dashboard contains Today’s Meals + upcoming 7-day meals.                              |
| DEC-020 | Resident Fund summary includes expandable financial breakdown.                                 |
| DEC-021 | Resident Dashboard layout is fixed for v1.                                                     |
| DEC-022 | Meal definitions persist until disabled/archive/delete through lifecycle rules.                |
| DEC-023 | Special meals are separate definitions with date-specific availability/history.                |
| DEC-024 | Holidays auto-disable applicable meals and exclude them from counts/billing.                   |
| DEC-025 | Guest meal requests are auto-accepted in v1; no approval workflow.                             |
| DEC-026 | Meal schedules are continuous/dynamic; no monthly schedule generation.                         |
| DEC-027 | Previous dues are shown separately from the current bill.                                      |
| DEC-028 | Deposits approved after bill/period close apply to the next cycle.                             |
| DEC-029 | Partial refunds are supported and tracked.                                                     |
| DEC-030 | Expenses are permanently locked after inclusion in the monthly snapshot.                       |
| DEC-031 | Bill numbering is configurable.                                                                |
| DEC-032 | Resident Fund cannot be negative; outstanding due is separate.                                 |
| DEC-033 | Approved financial transactions are immutable; corrections use Adjustment Entries/reversals.   |

## Accounting principles attached to the decisions

- Nonnegative resident fund is a stored/transactional invariant, not a display clamp.
- Snapshotted bills are reproducible and immutable at the authoritative boundary.
- Approved deposits/refunds and closed expenses are immutable facts.
- Corrections are additive compensating records.
- Every financial operation has a technical audit record and human-readable timeline event where appropriate.
- No permanent deletion of authoritative financial history.

Any future change to a locked decision requires an ADR recording rationale, migration/recovery implications, backward compatibility, and acceptance criteria.
