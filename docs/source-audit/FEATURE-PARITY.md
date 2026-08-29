# Feature Parity Register

Nothing from the reference disappears silently. Every meaningful legacy feature receives an explicit disposition.

| Feature | Disposition | Parity requirement |
|---|---|---|
| Registration/login/email verification/password reset | REFINED | Same user goals, stronger Workers auth/security |
| 2FA and sessions | REFINED | Preserve capability, explicit devices/revocation/secure storage |
| Resident/admin dashboard | REFINED | Preserve useful KPIs, fixed resident v1 content |
| Dynamic meals | PRESERVED/REFINED | No hardcoded meal names; add locked special/holiday rules |
| Resident meal booking/history | REFINED | Continuous schedule + cutoff authority |
| Kitchen/count operations | REFINED | Permission-aware operational workspace |
| Guest meals | REFINED | Auto-accepted v1 + configurable price |
| Billing | CORRECTED | Integer money, snapshot reproducibility, one calculation authority |
| Payments/deposits | CORRECTED | Atomic/idempotent immutable approved finance |
| Refunds | REFINED | Partial refund tracking and immutable effects |
| Adjustments | PRESERVED/REFINED | Standard correction mechanism |
| Resident funds | CORRECTED | Nonnegative invariant + separate due |
| Restrictions | REFINED | Explicit state machine/policy/reasons |
| Expenses | CORRECTED | Approval, close lock, no hard financial deletion |
| Purchases | REFINED | Distinct from direct expenses |
| Monthly closing | REPLACED/REFINED | Durable Cloudflare Workflow, retry/resume/reconcile |
| Variables | REFINED | Typed/versioned/scoped |
| Formula engine | PRESERVED/REFINED | Keep safe parser; add robust financial semantics/snapshots |
| Policies | REFINED | Explicit separation from settings/variables |
| Notifications/announcements | REFINED | Event-driven delivery |
| Reports/exports | REFINED | Authoritative server exports, lazy tooling |
| Audit | PRESERVED/REFINED | Immutable technical evidence |
| Activity timeline | REFINED | Human-readable separate feed |
| Settings | REFINED | Central institution/security/billing config |
| Personalization/theme | PRESERVED/REFINED | Shared tokens/accessibility limits |
| Search/filter | REFINED | Permission-aware consistent behavior |
| Command palette | PRESERVED/REFINED | Authorized navigation/actions only |
| Offline mobile | ADDED | Drift + safe queued operations |
| Shorebird OTA | ADDED | Channelled patches with release gates |
| Inventory/payroll/academic/room allocation | DEFERRED/REMOVED | Not v1 core |
| Leave/staff peripheral legacy features | REMOVED/DEFERRED | No silent carry-forward into core |

## Parity gate

A feature marked PRESERVED/REFINED/CORRECTED is considered complete only when its accepted behavior, permission rules, states, error handling, audit/timeline requirements, and relevant web/mobile experiences pass tests. A matching screen alone is not feature parity.