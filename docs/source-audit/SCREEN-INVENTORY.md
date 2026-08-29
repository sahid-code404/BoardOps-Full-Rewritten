# Screen / Surface Inventory

## Legacy application surfaces observed

The legacy UI uses a lazy in-memory `ViewKey` router rather than URL routes. Observed view keys/components include:

- Dashboard
- Admin Meal Configuration
- Resident/User Meals
- Kitchen
- Billing Hub
- Payments
- Expenses Hub
- Funds
- Monthly Closing
- Formula Engine
- Users
- Notifications Hub
- Settings Hub
- System Hub
- Profile
- Authentication screen/flows
- Command palette and app shell/navigation

The source component families additionally contain auth, audit, billing, calendar, dashboard, kitchen, meals, notifications, personalization, reports, settings, system, tasks, users, and variables-related UI.

## Required target web/mobile surfaces

### Visitor / authentication

Registration; email/OTP verification/status; pending/rejected/changes-requested states; login + 2FA challenge; forgot/reset password; session-expired/error states.

### Resident

Dashboard (Today’s Meals + next 7 days + fund/bill summary), Meals calendar/agenda/day views, bill list/detail, payment/deposit submit + proof/reference + status, fund breakdown/ledger, notifications, profile/personal info, password, sessions, 2FA, preferences.

### Authorized administration

Dashboard/alerts; Resident Management review/profile/lifecycle; Meal Configuration; Meal Operations/counts/overrides; Billing/preview/generation/history/details; Payments review/detail; Expenses/Purchases; Funds/ledger/restrictions; Variables; Formula Builder; Policies; Monthly Closing; Reports; Notifications/announcements; Settings; Audit; Activity Timeline; System/operations where permitted.

## Shared screen-state requirements

Every applicable screen defines navigation/header/title/actions, permission visibility, search/filter/sort/pagination or cursor behavior, loading/skeleton, empty, success, error, offline, forbidden, session-expired, maintenance, and responsive/adaptive behavior. Destructive/sensitive actions use confirmation and required reason where specified.

## Navigation correction

Target web uses real React Router URLs and deep links; filters/search/page live in the URL when appropriate. Flutter uses `go_router`. Persisting the active business screen only inside a Zustand store is not retained.
