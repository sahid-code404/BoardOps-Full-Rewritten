# ADR-001 — Monorepo

**Status:** Accepted

BoardOps uses one repository containing `apps/web`, `apps/mobile`, `services/api`, shared packages, migrations, docs and tooling. This keeps contracts, cross-surface tests and release provenance aligned while preserving strict application boundaries.
