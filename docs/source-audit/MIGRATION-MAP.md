# Migration Map — Legacy Concept → BoardOps Target

This is a conceptual migration map. It is **not** a source-code copy plan.

| Legacy area                                  | Target area                                | Action                                                               |
| -------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| Next.js `src/app` web + API                  | `apps/web` + `services/api`                | REPLACED architecture; behavior separated                            |
| Zustand persisted `ViewKey` navigation       | React Router routes                        | REPLACED                                                             |
| Prisma SQLite schema                         | D1 migrations/repositories                 | REPLACED; redesign constraints/types                                 |
| Next API route handlers                      | Hono `/api/v1` application use cases       | REPLACED                                                             |
| `User.role` checks                           | permission engine                          | CORRECTED                                                            |
| Role/Permission schema concepts              | permission domain                          | REFINED into single authority                                        |
| Meal configuration                           | meal-definition domain                     | PRESERVED/REFINED                                                    |
| MealEntry ON/OFF/LOCKED                      | meal booking/state-machine model           | REFINED                                                              |
| GuestMeal/Holiday concepts                   | guest/holiday rules                        | PRESERVED/REFINED                                                    |
| Bill calculation                             | accounting/billing service                 | CORRECTED; integer money + one source                                |
| BillingCycle/MonthlySnapshot                 | close workflow/snapshot                    | PRESERVED concept, REPLACED orchestration with Cloudflare Workflow   |
| Payment approval route                       | payment application use case               | CORRECTED atomic/idempotent                                          |
| Refund/Adjustment                            | finance correction domain                  | PRESERVED/REFINED                                                    |
| LedgerEntry                                  | immutable resident-fund ledger             | PRESERVED concept, CORRECTED concurrency/invariants                  |
| Expense/Purchase                             | expenses + purchase engine                 | REFINED; snapshot lock                                               |
| Variable                                     | typed versioned variable engine            | REFINED                                                              |
| Formula parser                               | formula engine                             | PRESERVED core idea; strengthen deterministic money/dependency rules |
| Policy endpoints                             | policy engine                              | REFINED                                                              |
| Restriction helper                           | restriction state machine/policy           | REFINED                                                              |
| Notifications                                | event-driven notification service          | REFINED                                                              |
| Audit log                                    | immutable audit store                      | PRESERVED/REFINED                                                    |
| Human activity views                         | activity timeline                          | REFINED/expanded                                                     |
| Local uploaded files/paths                   | R2 + D1 metadata                           | REPLACED                                                             |
| Filesystem rate limiter                      | Cloudflare Rate Limiting                   | REPLACED                                                             |
| Node crypto/session implementation           | Workers-compatible auth/session service    | REPLACED                                                             |
| Theme/CSS concepts                           | shared design tokens + web/Flutter mapping | REFINED                                                              |
| Legacy glass utility                         | bounded shared glass primitives            | REFINED                                                              |
| Source reports                               | report service + lazy web/mobile viewers   | REFINED                                                              |
| `.env`, DB, logs, backups, agent/tool output | none                                       | REMOVED                                                              |
| Leave/staff/payroll-like modules             | none in v1                                 | REMOVED/DEFERRED                                                     |

## Data migration note

No live production data migration has been requested in Phase 00. If legacy data must later be imported, it requires a separately accepted migration plan that converts money to minor units, maps immutable finance carefully, establishes institution ownership, reconciles ledger/bills/payments, and produces before/after totals. Never import the old SQLite file blindly.
