# BoardOps Shared Design Language

## Phase

Phase 02 — Shared design language.

## Reference baseline

The visual baseline preserves and refines the valuable characteristics identified during the Phase 00 source audit and the read-only legacy reference `sahid-code404/BoardOpsv2rewrite@77f3dec3b264c42904207f27c5f008b33c03b868`:

- purple/graphite premium identity;
- semantic light/dark theming;
- large rounded geometry;
- glass surfaces and layered dashboard hierarchy;
- purposeful motion and responsive interaction;
- personalization-friendly design semantics;
- safe-area and touch-first behavior.

The rewrite does not copy legacy framework code. It translates the accepted visual language into platform-neutral tokens and clean React/Flutter primitives.

## Canonical tokens

`packages/design-tokens/tokens.json` is the source of truth for:

- semantic light/dark colors;
- glass opacity and blur strength;
- radii;
- spacing;
- typography sizes;
- motion durations/easing;
- shadows;
- breakpoints;
- minimum touch target size;
- status and chart colors.

Run `pnpm design:tokens` after changing the canonical source. Generated outputs are checked by CI so Web and Flutter cannot silently drift.

## Glass rules

1. Backdrop blur belongs to bounded parent surfaces.
2. Do not nest multiple backdrop-filter/BackdropFilter layers for ordinary card content.
3. Nested content uses translucent color, border and elevation instead of another blur.
4. Large continuously moving backdrop-filter regions are forbidden.
5. Blur values remain tokenized so performance presets can be introduced without redesigning every component.
6. Flutter glass is clipped and wrapped in a repaint boundary.

## Motion rules

- Motion communicates state and hierarchy.
- Default transition duration is 240 ms; emphasized entrances may use 520 ms.
- Prefer opacity and transform/scale over layout animation.
- Pressed states must respond immediately.
- Reduced-motion settings must remove nonessential animation without hiding state.
- Ambient effects are intentionally limited in size and count.

## Typography

Use platform-native/system typography first to avoid unnecessary font payload and preserve native rendering quality. The visual hierarchy uses tight display tracking, high-weight headings, readable body line-height, and compact uppercase labels for institutional metadata.

## Responsive rules

Canonical breakpoints are compact 600 px, medium 768 px, expanded 1024 px, and wide 1440 px. These do not replace the required validation widths from the source audit; they provide reusable layout decisions.

Web must remain usable at 320, 360, 390, 430, 600, 768, 1024, 1280, 1440, 1920 and 2560 px. Flutter must remain usable on compact and large phones, foldable-friendly widths, tablets, portrait and landscape.

## Accessibility

- minimum interactive target: 44 px;
- visible keyboard focus on Web;
- semantic Material controls on Flutter;
- semantic status colors never carry meaning by color alone;
- safe-area handling on both platforms;
- reduced-motion support;
- contrast must remain readable in both themes.

## Phase 02 primitives

### Web

- `GlassSurface`
- `BoardOpsButton`
- `StatusChip`
- responsive design-system preview surface

### Flutter

- `buildBoardOpsTheme`
- `GlassPanel`
- `BoardOpsStatusChip`
- responsive design-system preview surface

These are foundations, not business modules. Feature-specific UI is introduced only in later phases after the shared visual system is accepted.
