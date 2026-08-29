# ADR-014 — TypeScript compatibility pin

**Status:** Accepted for Phase 01

The Phase 00 matrix proposed TypeScript 7.0.2, but the Phase 01 compatibility gate found that current `typescript-eslint` 8.68.0 officially supports TypeScript `>=4.8.4 <6.1.0`. BoardOps therefore pins TypeScript **6.0.3**, the newest stable 6.x release observed, so linting is supported rather than running an unsupported compiler/parser pairing.

TypeScript 7 will be adopted only after the lint/tooling stack officially supports it and CI proves compatibility. This follows the master rule: newest mutually compatible stable versions outrank blind latest-version adoption.
