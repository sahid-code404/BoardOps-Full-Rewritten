# Source Business-Rule Audit

## Safe/productive legacy intent to preserve

- Dynamic meal configuration rather than fixed meal-name code.
- Explicit payment, refund, bill, expense, fund, formula, variable, restriction, and monthly-close concepts.
- Formula tokenizer/parser/AST rather than JavaScript `eval`.
- Audit logging and notification intent around sensitive operations.
- Soft lifecycle concepts for users and operational records where legally/product appropriate.
- Idempotency intent in selected helpers (for example, attempts to avoid duplicate bill-settlement entries).

## Legacy rules that cannot become target truth

- Hardcoded role string checks such as ADMIN/SUPER_ADMIN as primary authorization.
- Treating current `User.status` or current role as a reliable historical billing membership source without an explicit membership timeline.
- Allowing a formula failure/missing formula to fall back to a legacy calculation without a clearly accepted policy. Financial calculation fallback must be explicit, visible, auditable, and preferably fail closed.
- Allowing current/future payment state and period assignment to be inferred across multiple independent writes.
- Soft/permanent deletion of approved authoritative financial events.
- Treating a UI clamp or derived display value as enforcement of a financial invariant.

## Target rule source

Where legacy behavior conflicts with `BOARDOPS-SRS-v0.1.md`, `docs/decisions/LOCKED-DECISIONS.md`, or correct accounting/security invariants, the legacy behavior is corrected rather than preserved for compatibility.