# Dependency / Version Matrix — Phase 00 Proposal

Verified against official/project package sources on **2026-08-29**. Pin exact versions in the initial lockfiles; upgrade deliberately after compatibility/CI review. Latest means stable, not alpha/beta/RC/nightly.

## Toolchain

| Name               | Exact version | Purpose                      | Why needed                            | Alternatives rejected                     | Runtime impact         | Maintenance risk     |
| ------------------ | ------------: | ---------------------------- | ------------------------------------- | ----------------------------------------- | ---------------------- | -------------------- |
| Node.js            |   24.20.0 LTS | JS tooling/CI                | Stable LTS for Vite/pnpm tooling      | Node 26 Current: avoid current-line churn | Build-time only        | Low                  |
| pnpm               |       11.23.0 | JS workspace/package manager | Strict, efficient monorepo installs   | npm/yarn: no product benefit here         | Build-time only        | Low                  |
| TypeScript         |         7.0.2 | Web/API type checking        | Current stable baseline               | JS-only: weaker contracts                 | Build-time only        | Medium: recent major |
| Prettier           |         3.9.6 | Deterministic formatting     | Reduces formatting churn              | Hand formatting                           | Build-time only        | Low                  |
| Vitest             |        4.1.11 | TS unit/domain tests         | Vite-native fast tests                | Jest: extra stack                         | Dev/CI only            | Low                  |
| @playwright/test   |        1.62.1 | Cross-browser critical E2E   | Required production flow validation   | Cypress: redundant second E2E stack       | Dev/CI; browsers large | Medium               |
| openapi-typescript |        7.13.0 | OpenAPI → TS types           | Runtime-free generated contract types | Hand-maintained types                     | Build-time only        | Low                  |

## Web (`apps/web`)

| Name                  | Exact version | Purpose                      | Why needed                                 | Alternatives rejected                                                                  | Runtime impact           | Maintenance risk               |
| --------------------- | ------------: | ---------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------ | ------------------------------ |
| react                 |        19.2.8 | UI runtime                   | Required web framework                     | Framework migration not justified                                                      | Core runtime             | Low                            |
| react-dom             |        19.2.8 | DOM renderer                 | Required with React                        | N/A                                                                                    | Core runtime             | Low                            |
| vite                  |         8.2.2 | Dev/build tool               | Current stable fast build                  | Next.js: conflicts with clean React/Vite target                                        | Build-time               | Low                            |
| @vitejs/plugin-react  |         6.1.0 | React Fast Refresh/JSX       | Official Vite React plugin                 | Custom Babel stack                                                                     | Build/dev                | Low                            |
| tailwindcss           |         4.3.3 | Token-driven utility styling | Efficient responsive design system         | CSS-in-JS: extra runtime                                                               | Mostly build-time        | Low                            |
| @tanstack/react-query |       5.102.8 | Server-state cache/mutations | Prevents custom cache/retry state          | Zustand for server state: rejected                                                     | Small runtime            | Low                            |
| react-router          |         8.3.0 | URL routing/navigation       | Real routes/deep links/query state         | Persisted Zustand pseudo-router: rejected                                              | Small runtime            | Medium: major recently current |
| zod                   |         4.5.0 | Contract/form validation     | Shared schema validation                   | Ad-hoc validators                                                                      | Small runtime            | Low                            |
| react-hook-form       |        7.86.0 | Form state                   | Efficient complex forms                    | Formik/custom state                                                                    | Small runtime            | Low                            |
| @hookform/resolvers   |         5.9.1 | RHF ↔ Zod bridge             | Keeps one schema source                    | Duplicate manual mapping                                                               | Tiny runtime             | Low                            |
| motion                |        13.1.1 | Intentional UI motion        | Production React motion/springs            | CSS only cannot cover all state transitions; `framer-motion` old package name rejected | Lazy-load where possible | Medium                         |
| lucide-react          |        1.34.0 | Icons                        | Consistent tree-shakeable icon set         | Multiple icon libraries                                                                | Tree-shakeable           | Low                            |
| zustand               |        5.0.15 | Small UI-shell state         | Appropriate for ephemeral shell state only | Redux: unnecessary weight                                                              | Tiny runtime             | Low                            |

**Radix:** do not install a bulk primitive set on day one. Add individual stable Radix primitives only when a feature demonstrably benefits from their accessibility behavior; record the exact package/version in the PR that introduces it.

## API (`services/api`)

| Name                    | Exact version | Purpose                                    | Why needed                              | Alternatives rejected                    | Runtime impact | Maintenance risk          |
| ----------------------- | ------------: | ------------------------------------------ | --------------------------------------- | ---------------------------------------- | -------------- | ------------------------- |
| hono                    |        4.13.5 | Worker HTTP framework                      | Web-standard, small, Workers-compatible | Express/Fastify: Node assumptions/weight | Very small     | Low                       |
| @hono/zod-validator     |         0.9.0 | Request validation adapter                 | Clean Hono + Zod integration            | Repeated route boilerplate               | Tiny           | Low                       |
| zod                     |         4.5.0 | Runtime request/domain boundary validation | Shared validation vocabulary            | Ad-hoc checks                            | Small          | Low                       |
| wrangler                |       4.126.0 | Cloudflare dev/deploy/types                | Official Workers CLI                    | Custom deploy scripts                    | Dev/CI only    | Medium: frequent releases |
| @cloudflare/vite-plugin |        1.54.1 | Vite ↔ workerd integration                 | Production-like Worker development      | Legacy Workers Sites tooling             | Dev/build      | Medium                    |

Platform bindings require **no wrapper dependency** by default: D1, R2, Queues, Workflows, Rate Limiting, and Web Crypto use Cloudflare/standards APIs. Generate binding types with `wrangler types`; do not add `@cloudflare/workers-types` as a competing manually maintained source unless a verified tooling requirement appears.

No ORM is approved in Phase 00. D1 schema/migration/query strategy must be chosen for correctness, transaction behavior, SQL visibility, and Workers compatibility before adding a package. The old Prisma/SQLite stack is explicitly not migrated.

## Flutter (`apps/mobile`)

| Name                   | Exact version | Purpose                           | Why needed                                         | Alternatives rejected                         | Runtime impact      | Maintenance risk                             |
| ---------------------- | ------------: | --------------------------------- | -------------------------------------------------- | --------------------------------------------- | ------------------- | -------------------------------------------- |
| Flutter SDK            | 3.47.1 stable | Mobile framework                  | Current released stable hotfix observed 2026-08-19 | Beta/master channels                          | Core                | Low                                          |
| Dart SDK               |        3.13.1 | Language/runtime                  | Bundled with Flutter 3.47.1                        | Separate Dart pin                             | Core                | Low                                          |
| flutter_riverpod       |         3.4.2 | App state/DI                      | Testable async state model                         | Global mutable state                          | Small               | Low                                          |
| go_router              |        18.0.0 | Navigation/deep links             | Official declarative routing                       | Hand-written Navigator routing                | Small               | Medium: new major                            |
| drift                  |        2.34.3 | Offline relational store          | Typed relational cache/sync metadata               | SharedPreferences/JSON as DB                  | Moderate            | Low                                          |
| drift_dev              |        2.34.5 | Drift codegen/schema tooling      | Official generator                                 | Hand-written generated DB code                | Dev only            | Low                                          |
| dio                    |        5.11.0 | HTTP layer                        | Interceptors/cancellation/error normalization      | Raw `http`: possible but more custom plumbing | Small/moderate      | Low                                          |
| flutter_secure_storage |        11.0.0 | Keychain/Keystore secrets         | Required durable credential protection             | SharedPreferences: forbidden for secrets      | Small native plugin | Medium: breaking migration from old versions |
| connectivity_plus      |         7.3.1 | Connectivity hint                 | Helps sync UX; never treated as reachability proof | Platform channels                             | Small native plugin | Low                                          |
| freezed                |         4.0.0 | Immutable/codegen where justified | Reduces error-prone model boilerplate              | Manual immutable classes                      | Dev/codegen         | Medium: recent major                         |
| freezed_annotation     |         3.1.0 | Freezed annotations               | Required with Freezed                              | N/A                                           | Tiny                | Low                                          |
| json_annotation        |        4.12.0 | JSON annotations                  | Works with generated API models                    | Hand JSON parsing                             | Tiny                | Low                                          |
| json_serializable      |        6.14.1 | JSON codegen                      | Repeatable typed serialization                     | Hand serializers                              | Dev/codegen         | Low                                          |
| build_runner           |        2.16.0 | Dart codegen driver               | Required for generators                            | Custom scripts                                | Dev only            | Low                                          |
| path_provider          |         2.1.6 | App DB/file locations             | Needed for persistent local DB/files               | Hardcoded filesystem paths                    | Small plugin        | Low                                          |
| file_picker            |        12.1.1 | Payment proof/receipt selection   | Native file selection for required uploads         | Custom platform pickers                       | Native plugin       | Medium                                       |

`sqlite3_flutter_libs` is rejected: the modern SQLite/Dart ecosystem makes the old package path obsolete and it adds unnecessary maintenance.

## OTA

Shorebird remains the accepted OTA mechanism. `shorebird_code_push` **2.0.7** is optional and should be added only if BoardOps needs an in-app check/download/status UI; automatic Shorebird update behavior does not require adding it solely to enable patches. Shorebird CLI itself is an external release tool, not a pub dependency. CI must record the installed stable CLI version and verify the selected Flutter SDK is supported before each release. Shorebird documentation currently lists Android/iOS support from Flutter 3.24+ and recommends latest stable Flutter.

## Explicitly rejected legacy dependencies/approaches

- Next.js + Next API routes: replaced by separate React/Vite web + Workers API.
- Prisma + local SQLite server DB: replaced by D1 architecture/migrations.
- Node `fs` persistence for rate limiting: replaced by Cloudflare Rate Limiting.
- Node-only backend packages without Workers verification.
- Bulk UI libraries and multiple icon/chart/form/state stacks.
- `framer-motion` old package naming when current `motion` is sufficient.
- Client-side financial calculation libraries as a second source of truth.

## Compatibility gates before Phase 01 lockfile

1. Run minimal React/Vite/TS7 build with React Router 8.3.
2. Run Hono/Workers integration under workerd using the Cloudflare Vite plugin.
3. Generate Worker binding types using the selected Wrangler.
4. Run a minimal Flutter 3.47.1 app with go_router/Riverpod/Drift codegen.
5. Verify Shorebird supports the exact Flutter engine used by the release toolchain.
6. If any newest-stable pair is incompatible, pin the newest mutually compatible stable versions and document the downgrade in an ADR before implementation.
