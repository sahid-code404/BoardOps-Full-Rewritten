# UX Problems / Refinement Map

## 1. Pseudo-routing

Legacy business views are switched through persisted UI state. This weakens deep linking, browser Back/Forward semantics, refresh/share behavior, route-level permission boundaries, analytics, and URL-addressable filters.

**Target:** React Router routes; Flutter `go_router`; meaningful filters/search/page in URL on web.

## 2. Admin navigation can become a page list

The legacy source has many top-level feature views. As functionality grows, a flat navigation list becomes an ERP-like wall of modules.

**Target:** understandable workspaces — Resident Management, Meal Operations, Finance, Billing/Payments, Formula & Variables, Reports, Administration, System & Audit — with progressive disclosure.

## 3. Financial status explainability

A user must not see only a balance/status chip. They need current fund, pending deposit, current/previous due, refunds, adjustment history, bill provenance, and why a restriction changed.

**Target:** Resident Fund summary + expandable breakdown + timeline/audit-derived explanations.

## 4. Sensitive action reasoning

Any UI that allows void, financial correction, override, restriction/exemption, archive, or close exception must collect a reason before submission and show the resulting timeline state.

## 5. State completeness

Every major surface needs loading/skeleton, empty, error, permission denied, offline, stale/syncing, session expired, maintenance, validation, destructive-confirmation, and retry behaviors. Do not rely on generic toasts for core workflow state.

## 6. Mobile parity

Desktop may show denser tables/panels, but mobile must remain the same product. Actions move into sheets/context menus/adaptive controls rather than disappear.

## 7. Search and filters

Search must be permission-aware and consistent. Debounce, category grouping, match highlighting, clear state, no-result/error/loading states, keyboard access, and URL persistence where useful are required.

## 8. Glass legibility/performance

Do not make glass so transparent that text loses contrast. Conversely, do not remove the intended premium glass language globally to solve performance. Bound expensive regions and provide accessible personalization/reduced transparency modes.

## 9. Resident dashboard scope

Resident Dashboard is intentionally fixed for v1 (DEC-021) and must include Today’s Meals, upcoming seven-day meals, and the accepted fund/billing summary rather than becoming a configurable widget builder.
