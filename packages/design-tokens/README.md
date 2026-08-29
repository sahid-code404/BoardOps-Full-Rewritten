# Shared design tokens

`tokens.json` is the canonical, platform-neutral source for BoardOps Phase 02 visual semantics. It is derived from the accepted product specification and the valuable purple/graphite, rounded, glass-heavy characteristics of the read-only legacy reference.

Run `pnpm design:tokens` after changing the canonical token source. The generator writes:

- `packages/design-tokens/web/tokens.css` for React/Vite;
- `apps/mobile/lib/design/design_tokens.dart` for Flutter.

`pnpm test` runs `pnpm design:tokens:check` first so CI fails when generated platform tokens drift from the canonical source.

Glass is deliberately bounded: blur belongs to a small number of parent surfaces, while nested surfaces use translucent fills instead of nested backdrop filters. Reduced motion, visible focus, safe areas, minimum touch targets, and semantic status colors are part of the shared language rather than optional polish.
