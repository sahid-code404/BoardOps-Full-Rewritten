# BOARDOPS SRS v0.1

**Status:** Phase 00 product consolidation — audit baseline, not implementation approval  
**Audit date:** 2026-08-29  
**Read-only reference repository:** `sahid-code404/BoardOpsv2rewrite` at commit `77f3dec3b264c42904207f27c5f008b33c03b868`  
**Target repository:** `sahid-code404/BoardOps-Full-Rewritten`

## 1. Requirement precedence

When sources conflict, BoardOps follows this order:

1. The supplied master build specification.
2. Explicit locked decisions in the supplied BoardOps specification/conversation.
3. Correct accounting and security invariants.
4. Intended product behavior in the old repository.
5. Old implementation details.

Old bugs, accidental data models, or implementation shortcuts never outrank accounting correctness, security, or locked product decisions.

## 2. Product definition

BoardOps is an institution-focused mess operations and accounting platform. It is not a prototype, CRUD-only dashboard, website wrapper, source-code migration, or generic SaaS control plane.

The coherent ecosystem contains exactly three primary applications:

- `apps/web` — React/Vite web application for residents, administrators, board/authorized users, and responsive browser access.
- `apps/mobile` — one Flutter application for Android and iOS with permission-aware resident/admin experiences.
- `services/api` — one authoritative Cloudflare Workers domain/API system used by web, Flutter, jobs, and future integrations.

The backend is the authority for business rules. Clients never duplicate authoritative accounting, authorization, cutoff, restriction, or closing logic.

## 3. Scope

Core scope includes authentication and account lifecycle; resident management; granular permissions; configurable meals and guest meals; purchases; direct expenses; resident fund/deposits; bills; payments; refunds; adjustments; variables; formulas; policies; restrictions; monthly closing and immutable snapshots; reports; notifications; settings; audit; activity timelines; global search; personalization; offline-safe mobile behavior; and controlled mobile OTA.

BoardOps v1 is institution-focused. The schema must have a clean institution/workspace boundary, but the product must not expose a giant multi-tenant SaaS administration layer. Inventory, payroll, academic records, hostel room allocation, and unrelated attendance are excluded unless a later accepted specification explicitly adds them.

## 4. Golden rules

- Prefer configurable behavior wherever institutions legitimately vary; never hardcode breakfast/lunch/dinner, currency labels, billing dates, cutoffs, guest charges, invoice numbers, or similar policy values.
- Do not add feature bloat merely because it existed in an old experiment.
- Every meaningful event must be explainable: what, when, why, actor, financial impact, current status, and applicable rule/policy.
- A financial result has one source of truth. Formula/accounting output is consumed by bills, reports, dashboards, web, and mobile rather than recalculated independently.
- Automation is never hidden. Every automation specifies trigger, conditions, action, configuration, audit, notifications, failures, reversal/rollback behavior, and user-visible state.
- Sensitive actions require a reason where specified, including voids, overrides, restrictions/exemptions, archive/corrections, adjustments, and close exceptions.
- Mobile-first does not mean a different desktop product; layouts adapt while concepts remain consistent.
- Ambiguous business logic is documented before implementation.

## 5. Institution and identity model

Every business record that requires isolation belongs to an institution/workspace boundary. Cross-institution leakage is forbidden.

Registration uses a stable `institution_user_id` concept with a configurable display label such as Student ID, Roll Number, Employee ID, Hostel ID, or Registration Number. Identity-document upload is excluded from v1 unless separately accepted.

Account lifecycle is explicit and state-machine driven. The canonical target states cover registration, email verification, review, requested changes, approval, active service, restriction/suspension, archive, and rejection. Exact persisted enums will be finalized with migrations rather than copied from the legacy schema.

## 6. Authorization

Authorization is permission-based, not `if ADMIN` logic. A user receives roles and/or direct grants according to the accepted permission model, and backend enforcement is authoritative. Frontend visibility is only convenience.

Representative permissions include resident read/approve/edit, meal configure/override, payment submit/review/approve/void, expense create/approve, billing generate/publish/close, formula manage, report export, settings manage, and audit read.

Permission profiles are excluded from v1 as a separate end-user feature; the data model may still support role/permission composition cleanly. No module may maintain a second contradictory authorization system.

## 7. Reusable state-machine framework

A common transition engine must serve Resident, Registration, Payment, Bill, Refund, Purchase, Expense, Restriction, Billing Cycle, and Background Task lifecycles. Every transition declares allowed source states, destination state, required permission, preconditions, side effects, domain events, audit, timeline, notifications, and reason requirements.

Domain events include concepts such as `ResidentApproved`, `ResidentRestricted`, `MealOverridden`, `PaymentSubmitted`, `PaymentApproved`, `PaymentVoided`, `ExpenseApproved`, `BillPublished`, `RefundProcessed`, `MonthlyClosingStarted`, `MonthlyClosingCompleted`, `FormulaActivated`, and `PolicyChanged`.

## 8. Meal engine

Meals are durable configurable definitions, not hardcoded meal names. A definition includes internal/display names, description, icon/accent, service window, booking cutoff, display order, active state, visibility, and applicable rules. Special meals use separate definitions with date-specific availability/history.

Resident schedules are continuous/dynamic rather than generated as a monthly batch. Residents may modify a meal until the authoritative server cutoff. Admin override after cutoff requires permission, mandatory reason, original/new value, actor, timestamp, audit event, timeline event, and resident-visible indication. Holidays can automatically disable applicable meals and exclude them from counts/billing. Guest meal requests are auto-accepted in v1 and use configurable pricing.

## 9. Purchase and expense engines

Purchases and direct expenses are distinct concepts. Purchases contain products/items, quantity, unit, unit cost, supplier/vendor, receipt, date, category, and approval. Products/units/categories are configurable.

Direct expenses support draft/approval, receipt, vendor, category, description, amount, date, history, and audit. Once included in a monthly financial snapshot, expenses are permanently locked; corrections use financial adjustment/reversal mechanisms rather than mutation or hard deletion.

## 10. Money and ledger invariants

Authoritative money is stored in integer minor units. Binary floating-point is forbidden for authoritative financial amounts. Example: INR ₹1,250.50 is stored as `125050` minor units using names such as `amount_minor`, `balance_minor`, `charge_minor`, and `refund_minor`.

Financial effects create immutable ledger entries. A mutable balance field is never the sole history. The resident fund is an advance-deposit account derived from ledger facts. It cannot become negative; unpaid liability is represented separately as outstanding/current/previous due. Excess balance after monthly settlement is refunded according to the locked decision rather than silently carried forward.

Approved financial transactions and closed/snapshotted records are immutable. Corrections use void/reversal/adjustment entries with reason, actor, provenance, audit, and timeline. Authoritative financial history is never permanently deleted.

Every money endpoint requires an idempotency strategy. Atomic financial operations must commit domain state, ledger/outbox effects, and audit intent consistently; partial financial commits are unacceptable.

## 11. Variable, formula, policy, and configuration engines

Variables are typed, validated, scoped, versioned, and auditable. Policies and variables are distinct from ordinary UI settings. Formula evaluation uses a parser/AST; `eval`/`Function` execution is forbidden. Formula versions are validated and reproducible, with dependency/cycle checks and deterministic rounding rules.

Historical bills/monthly snapshots preserve formula version, variable values, policy values, source counts, and other inputs needed to reconstruct the result. Bill numbering is configurable and centrally generated.

## 12. Resident Fund and Restriction engines

The Resident Fund Account is the financial backbone: available balance, pending deposits, refund pending, current/previous due, transaction history, and a derived status. Locked financial status vocabulary includes HEALTHY, LOW_BALANCE, RESTRICTED, EXEMPTED, and OVERDUE where applicable.

The Restriction Engine is policy-driven with configurable grace/threshold rules. A restriction/exemption is explicit, auditable, reasoned, and reversible through a defined transition. A payment may lift a financial restriction only after authoritative settlement logic confirms conditions.

## 13. Billing and monthly closing

Billing uses authoritative formula/accounting results, not divergent calculations in multiple routes. Previous dues remain separately visible from the current bill. Deposits approved after a closed cycle apply to the next cycle according to the locked rule. Partial refunds are supported and tracked.

Monthly close is a durable, idempotent workflow suitable for Cloudflare Workflows. It validates readiness, freezes a monthly snapshot, computes authoritative charges, generates/publishes bills, settles resident funds, creates required refunds/due records, locks financial source records, and closes the cycle. Retries must resume safely. Reconciliation is mandatory. The system must never leave a half-closed financial period.

Rollback is only permitted before the irreversible publication boundary defined by the final state machine. After the boundary, corrections use adjustments/reversals rather than history rewrites.

## 14. Authentication and session security

Required flows include registration, institution identity, email verification, approval, login, OTP, forgot/reset password, 2FA-ready architecture, session/device listing, revocation, expiry, and account lifecycle handling.

Web sessions prefer secure HttpOnly cookies. Mobile durable secrets live in Android Keystore/iOS Keychain via secure storage. Tokens are not kept in ordinary preferences. Password hashing, token generation, OTP limits/expiry/replay protection, login throttling, suspicious-login events, and constant-time comparisons must use audited Workers-compatible primitives/services; Node-only filesystem/crypto assumptions are not allowed in the Cloudflare Worker runtime.

## 15. Files, notifications, and communications

Binary uploads such as payment proof, receipts, avatars, and exports belong in R2; D1 stores metadata and references. Files need validation, size/content rules, access authorization, lifecycle rules, and no public-by-default leakage.

Notifications can use in-app, email, and justified push delivery. Push is non-authoritative. Email is behind an `EmailService` abstraction so the provider can change. Domain events drive notification delivery instead of tightly coupling modules.

## 16. API and contract

The API is versioned under `/api/v1/`. A single OpenAPI 3.1 contract is authoritative for requests/responses, generated/validated TypeScript client types, Dart models/client generation, API docs, and contract tests. Errors use a structured safe envelope with stable codes, validation details where appropriate, trace/correlation IDs, and no sensitive internals.

Server time is authoritative for meal cutoffs, billing dates, workflow boundaries, and other time-sensitive policy decisions.

## 17. Web requirements

Web is React/Vite, mobile-first, responsive from 320 through 2560px, with TanStack Query for server state, React Router for route/navigation state, React Hook Form + Zod for forms, and Zustand only for small UI-shell state. Search/filter/page state should be URL-addressable where useful. Major views are lazy loaded and route-based rather than a persisted in-memory pseudo-router.

## 18. Flutter requirements and offline model

One Flutter app serves Android and iOS. Riverpod owns application state; `go_router` owns routing; Drift provides offline-capable relational storage. Layouts adapt to compact/large phones, foldables, tablet, portrait, and landscape.

Offline behavior is classified by risk. Low-risk reads and explicitly safe queued actions may work offline. High-risk financial approvals, authoritative meal cutoff decisions, billing close, permission changes, and similar operations require current server authority. Queued mutations use stable client operation IDs/idempotency keys and visible sync state. Connectivity is a hint, not proof that the server is reachable.

## 19. OTA and releases

Shorebird is used for Flutter Dart-code patches across development/staging/production channels. Production patches require explicit release approval. Native dependency, platform, entitlement, SDK, or asset changes that cannot safely be patched use normal Android/iOS store releases. Android production distribution uses signed release artifacts/AAB as appropriate; iOS uses TestFlight/App Store processes. Old mobile versions must remain contract-compatible within a documented support window.

## 20. UI/UX and accessibility

The design language is Apple-level refinement + premium bounded glassmorphism + modern finance dashboard + institutional clarity. It must not resemble a generic Bootstrap/CRUD admin template, overloaded ERP, gaming UI, or neon cyberpunk interface.

Web and Flutter share platform-neutral tokens for semantic colors, glass opacity, blur, radii, spacing, type scale, motion timing/easing, shadows/glows, elevation, breakpoints, status colors, and charts. Glass creates hierarchy without sacrificing legibility. Performance is solved by bounding blur regions/layers/overdraw rather than deleting blur globally.

Motion communicates state: page/navigation transitions, press/hover feedback, counters, tabs, sheets, filters/search, skeletons, success states, badges, charts, and state changes. Prefer transform/opacity; avoid continuously animating layout dimensions, large shadows, blur, and top/left. Respect reduced motion and pause nonessential animation when hidden.

Target WCAG AA where applicable with keyboard access, focus indicators, screen-reader semantics, VoiceOver/TalkBack, dynamic text, sufficient contrast, and adequate touch targets.

## 21. Search, audit, and timeline

Global search returns only authorized data, supports debounce, keyboard access, categories, highlighting, loading/empty/error states, and optional recent queries. Audit records are immutable technical evidence. Human-readable activity timeline is a separate product surface. Both capture appropriate provenance without exposing secrets.

## 22. Cloudflare backend and data architecture

Backend runs on Cloudflare Workers using TypeScript/Hono and Workers-compatible dependencies only. D1 is relational authority; R2 stores binaries; Queues handle asynchronous work; Workflows handle durable multi-step operations such as close/recovery; Cloudflare Rate Limiting protects abuse-sensitive routes; Web Crypto is preferred for compatible cryptographic primitives. Web deployment uses current Workers Static Assets/Vite integration, not legacy Workers Sites.

D1 schema design must include institution boundaries, foreign keys, unique constraints, idempotency keys, state/version columns, indexes for common filters, immutable financial ledgers, outbox/event records, audit records, and migration discipline.

## 23. Environments and operations

Development, staging, and production are distinct for D1, R2, queues/workflows, secrets, domains, email/push configuration, and OTA channels. Real `.env` files, local DBs, backups, uploads, logs, agent scratch data, generated artifacts, and old deployment junk are never committed.

CI gates ultimately cover format/lint/type checks, unit/domain tests, contract tests, migration verification, web build, API build/type generation, Flutter analyze/test/build checks, security checks, and Playwright critical flows. Observability includes structured logs, correlation IDs, workflow/job state, error reporting, and actionable metrics without sensitive data leakage.

## 24. Locked decisions incorporated

This SRS incorporates DEC-001 through DEC-033 from the supplied specification, including institution-focused deployment, permission authorization, variables/formulas, resident advance fund, excess refund, configurable guest pricing, low-balance restrictions, reasoned meal override, configurable billing schedule, snapshots/timeline, approval review flow, Institution User ID terminology, v1 exclusions, fixed resident dashboard content, persistent/special/holiday meals, auto-accepted guest meals, continuous scheduling, previous due separation, next-cycle deposits after close, partial refunds, closed-expense lock, configurable bill numbering, nonnegative fund, and immutable approved finance with adjustment-based corrections.

See `docs/decisions/LOCKED-DECISIONS.md` for the indexed decision record.

## 25. Phase 00 acceptance criteria

Phase 00 is accepted only when:

- all required source-audit documents exist and distinguish preservation from correction/removal;
- no reference feature disappears silently;
- known accounting/security/permission flaws are explicitly recorded rather than copied;
- this SRS reflects the master specification and locked decisions without invented business rules;
- the exact dependency/version proposal has been reviewed;
- the old repository remains unmodified;
- no implementation scaffold has been created prematurely.

Only after explicit acceptance may Phase 01 create the clean monorepo and prove that Web, API, and Flutter boot before major business modules begin.

**Current checkpoint: NOT READY — CONTINUE FIXING / REVIEW.** There is intentionally no runnable product in Phase 00.