# BoardOps Business Rules Baseline

This document consolidates locked rules that implementation must treat as domain invariants, not UI conventions.

## Identity and authorization

- Institution User ID is the stable field; its display label is configurable.
- Account approval uses Review → Approve / Reject / Request Changes behavior.
- Authorization is permission-based and backend-authoritative.
- Frontend hiding does not grant or deny authority.
- Sensitive transitions capture a reason when the rule requires one.

## Meals

- Meal definitions are configurable and persistent until disabled/archived/deleted through valid lifecycle rules.
- No Breakfast/Lunch/Dinner assumption is embedded in code.
- Schedules are continuous/dynamic; monthly schedule generation is not the model.
- Resident edits stop at authoritative cutoff.
- Admin cutoff override needs permission + mandatory reason + audit + timeline + old/new values + actor/time.
- Special meals are separate date-aware definitions/history.
- Holidays can disable meals and remove them from counts/billing.
- Guest meal requests are auto-accepted in v1; guest pricing is configurable.

## Billing and resident funds

- Resident funds use an advance-deposit model.
- Available resident fund may never be negative; liability is outstanding due.
- Previous due remains separately visible from current-period bill.
- Approved deposits after a period is closed apply to the next cycle.
- Excess after monthly settlement is refunded under the locked policy rather than silently carried forward.
- Partial refunds are supported and tracked.
- Bill numbering is configurable.
- Bills/settlements consume authoritative formula/accounting results rather than local duplicate formulas.

## Expenses, purchases, corrections

- Purchase and direct expense are distinct domain concepts.
- Expense categories/products/units are configurable.
- Expenses included in a monthly snapshot are permanently locked.
- Approved financial transactions are immutable.
- A correction is a void/reversal/adjustment trail; never edit history into a new story.
- Authoritative financial history is not permanently deleted.

## Variables, formulas, policies

- Variables are typed, validated, scoped, versioned, and audited.
- Formula definitions are parser/AST based; no runtime code evaluation.
- Settings, variables, and policies are separate concepts.
- Formula/variable/policy snapshots make historical calculations reproducible.
- Server time is authoritative for cutoffs and cycle boundaries.

## Monthly close

- Close is a durable idempotent workflow, not one fragile request handler.
- It validates readiness, freezes inputs, calculates, bills, settles, refunds/records due, locks sources, reconciles, and closes.
- Retries resume safely; duplicate financial effects are prevented by database-enforced idempotency.
- No half-closed period is acceptable.
- After irreversible publication/close, corrections use adjustments/reversals.

## Automation

Every automation documents trigger, conditions, action, configuration, audit behavior, notification behavior, failure behavior, reversal/rollback behavior, and user-visible state.