# Architecture Boundaries — Phase 01

## Primary surfaces

- `apps/web`: presentation, routing, accessibility and web interaction only. No authoritative accounting or permission decisions.
- `apps/mobile`: Flutter presentation, local/offline state and sync orchestration. High-risk actions require server authority.
- `services/api`: authoritative domain/API boundary on Cloudflare Workers.

## Shared packages

- `packages/api-contract`: OpenAPI and generated/portable contract types only.
- `packages/domain-spec`: shared domain vocabulary/specification, not a second runtime calculation engine.
- `packages/design-tokens`: Phase 02 design tokens only.
- `packages/test-fixtures`: deterministic fixtures; never production data.
- `packages/config`: shared tooling configuration.

## Dependency direction

Clients may depend on contracts and presentation utilities. Domain authority flows from API/domain logic outward. The API must never import web/mobile presentation code. Web and mobile must never duplicate authoritative financial calculations, cutoff decisions, permission checks, or monthly-closing logic.

## Phase 01 constraint

Only health/meta/bootstrap behavior is implemented. No business module starts before Web, API and Flutter verification succeeds.
