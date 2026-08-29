# Product Baseline

## Product

**BoardOps** — a complete institutional mess operations and accounting platform.

It coordinates residents, authentication, permissions, meals/bookings/guests, purchases, expenses, resident funds, deposits/payments, bills, refunds/adjustments, variables/formulas/policies, restrictions, monthly close, reports, notifications, audit, settings, and administration.

## Deployment model

BoardOps v1 is institution-focused. One deployment/workspace serves one institution experience; the data model still carries an institution boundary so isolation remains structurally correct. No cross-institution data leakage is acceptable. A separate giant SaaS administration layer is out of scope.

## Applications

Exactly three primary applications are planned:

- `apps/web`
- `apps/mobile` (one Flutter Android+iOS binary with permission-aware surfaces)
- `services/api`

Clients consume the same authoritative API/domain system.

## Product principles

1. Configurable over meaningful hardcoding.
2. No feature bloat.
3. Full transparency and explainability.
4. One source of truth for calculations.
5. No hidden automation.
6. Reasons for sensitive actions.
7. Mobile-first, not mobile-only.
8. Document ambiguity before implementation.
9. Financial correctness before legacy compatibility.
10. Long-term maintainability/recoverability before fastest code generation.

## v1 exclusions

Unless later accepted: generic multi-institution SaaS administration, identity-document upload, permission-profile UI, inventory, payroll, academic records, hostel room allocation, unrelated attendance, and unrelated enterprise modules.

## Primary workspaces

Resident: Dashboard, Meals, Billing, Payments/Fund, Notifications, Profile/Security.

Administrative/authorized: Dashboard, Resident Management, Meal Operations, Finance, Billing, Payments, Expenses/Purchases, Formula & Variables, Reports, Administration, System & Audit.

Complex functions use progressive disclosure; the top navigation must not become a page dump.
