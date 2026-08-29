# UI / Design Inventory

## Valuable legacy characteristics

- Purple/graphite premium visual identity.
- Light/dark semantic OKLCH token approach.
- Large rounded geometry and card/surface hierarchy.
- Glass surface primitives, animated background, skeletons, command palette, responsive shell.
- Theme/personalization concepts: accent, radius, transparency/blur intensity.
- Safe-area awareness and mobile-oriented touch behavior.
- KPI-heavy finance/operations dashboards.

## Required refinement

The target visual language is **Apple-level refinement + premium glassmorphism + modern finance dashboard + institutional clarity**. It must not become a generic admin template, overloaded ERP, gaming surface, or neon cyberpunk UI.

The legacy stylesheet sometimes solves scrolling performance by making its base `.glass` effectively solid with no backdrop blur. The master specification explicitly rejects deleting blur as the blanket optimization. The target instead bounds blurred regions, layer count, nested filters, overdraw, repaint boundaries, and animation cost. One parent blur plus translucent child surfaces is preferred over nested blur stacks.

Web and Flutter must consume the same platform-neutral semantic design tokens rather than independently picking colors/radii. Required token families: semantic colors, glass opacity, blur, radii, spacing, typography, motion duration/easing, shadows/glows, elevation, breakpoints, status colors, and chart palette.

## Accessibility

Target WCAG AA where applicable: keyboard navigation, visible focus, screen reader labels, VoiceOver/TalkBack, dynamic text, reduced motion, contrast, and touch targets. Personalization may not reduce contrast/legibility below acceptable thresholds.

## Responsive/adaptive validation

Web validation widths: 320, 360, 390, 430, 600, 768, 1024, 1280, 1440, 1920, 2560px. Flutter validates compact/large phones, foldable-friendly widths, tablet, portrait, and landscape.
