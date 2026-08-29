# PHASE 02 — Shared Design Language

## Objective

Create one platform-neutral BoardOps visual language for React/Vite and Flutter before business screens are rebuilt.

## Reference requirements reviewed

Phase 00 UI/design inventory, animation inventory, responsive/accessibility requirements, the accepted product specification, and the read-only legacy visual baseline.

## Architecture decisions

- canonical design tokens live in `packages/design-tokens/tokens.json`;
- Web and Flutter generated token outputs are checked for drift;
- no extra UI framework is introduced;
- glass blur is bounded to parent surfaces;
- nested glass stacks are prohibited by design convention;
- system typography is preferred to avoid font payload and platform rendering regressions;
- motion is primarily transform/opacity based and reduced-motion aware.

## Files created

- canonical token source and generator;
- generated Web CSS tokens;
- generated Flutter token constants;
- Web design primitives;
- Flutter theme/glass/status primitives;
- design-language architecture documentation.

## Files modified

- Web foundation preview;
- Web global styles;
- Flutter application theme and foundation preview;
- shared test scripts and lint configuration;
- README and changelog.

## Files removed

None.

## Database migrations

None. No business/domain persistence is part of Phase 02.

## API changes

None.

## Web changes

The neutral Phase 01 boot card becomes a responsive design-language preview showing the purple/graphite identity, bounded glass, KPI-card hierarchy, semantic status chips, primary/secondary controls and light/dark preview switching.

## Flutter changes

Flutter now consumes generated shared tokens through a BoardOps ThemeData foundation and reusable glass/status primitives. The foundation screen mirrors the same hierarchy and visual semantics without copying Web implementation code.

## UI/UX changes

- shared light/dark semantic colors;
- rounded hierarchy up to 32 px cards and pill controls;
- bounded glass surfaces;
- status semantics;
- safe-area aware responsive layouts;
- minimum 44 px interactive targets;
- visible focus on Web.

## Animation changes

- emphasized content entrance;
- fast hover/press feedback;
- limited ambient background motion;
- reduced-motion fallback;
- no continuously animated layout dimensions or nested backdrop filters.

## Business logic changes

None.

## Security changes

None.

## Performance changes

- no UI runtime dependency added;
- backdrop blur is bounded rather than applied to every nested card;
- Flutter glass uses clipping and repaint boundaries;
- ambient effects are limited to two regions;
- platform-native typography avoids font downloads/bundles.

## Memory changes

No persistent caches or business state added.

## Tests added/updated

- generated design-token synchronization check;
- Web export coverage for shared primitives;
- Flutter boot test updated for the Phase 02 surface.

## CI verification

Pending GitHub Actions on the Phase 02 branch.

## Local verification

Do not mark runnable until CI is green. When green, exact Web testing commands will be provided to the user first, per their requested workflow.

## Known limitations

This phase intentionally does not implement business navigation, accounting, D1, R2, authentication, offline persistence or OTA.

## Deferred items

All feature modules and backend/domain work remain in later phases.

## Exit criteria

- canonical token drift check passes;
- Web format/lint/typecheck/tests/build pass;
- Flutter analyze/tests/Android debug build pass;
- iOS no-codesign compile validation passes;
- design preview is usable at compact and desktop widths;
- no major regression in the Phase 01 foundation.

## Final status

NOT READY — CONTINUE FIXING until the Phase 02 branch CI is green.
