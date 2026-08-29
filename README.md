# BoardOps

BoardOps is being rebuilt from scratch as a production-grade institutional mess operations and accounting ecosystem.

## Current phase

**Phase 02 — Shared design language is in implementation/verification.**

Active implementation branch: `phase/02-shared-design-language`.

The existing application at `sahid-code404/BoardOpsv2rewrite` remains a **read-only visual and functional reference**. Legacy framework code is not copied into the rewrite.

Phase 01 is merged into `main`. Phase 02 establishes the shared visual foundation before any major business screen is rebuilt:

- canonical platform-neutral semantic design tokens;
- generated Web and Flutter token outputs with drift checks;
- purple/graphite light/dark identity;
- bounded premium glass system;
- large rounded geometry;
- typography, spacing, status and chart semantics;
- purposeful motion with reduced-motion handling;
- responsive/safe-area rules;
- initial reusable React and Flutter visual primitives.

Business modules intentionally remain absent in this phase.

## Design-token workflow

From the repository root:

```bash
pnpm design:tokens
pnpm design:tokens:check
```

Do not hand-edit the generated Web or Flutter token files. Edit `packages/design-tokens/tokens.json` and regenerate them.

## Verification status

Phase 02 CI is pending. Do not treat this branch as a completed checkpoint until Web/API, Flutter Android and Flutter iOS jobs are green.
