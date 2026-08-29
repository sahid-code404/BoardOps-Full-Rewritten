# BoardOps

BoardOps is being rebuilt from scratch as a production-grade institutional mess operations and accounting ecosystem.

## Current phase

**Phase 02 — Shared design language is runnable and ready for manual visual testing.**

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

## Verified Phase 02 CI

GitHub Actions run `33263066836` passed all required jobs:

- Web/API formatting, lint, TypeScript, token synchronization, unit tests and builds;
- Flutter analyze and widget/unit tests;
- Android debug APK build;
- iOS no-codesign compile validation.

## Web manual testing

From the repository root:

```bash
git fetch origin
git switch phase/02-shared-design-language
git pull --ff-only origin phase/02-shared-design-language
pnpm install --frozen-lockfile
pnpm --filter @boardops/web dev
```

Open `http://localhost:5173` and review both Light and Dark preview states at desktop and narrow/mobile widths.
