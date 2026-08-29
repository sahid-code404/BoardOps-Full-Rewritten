# Animation / Interaction Inventory

## Motion to preserve/refine

The source product and supplied design requirements establish a motion-rich but purposeful experience. Target primitives include:

- page and navigation transitions;
- card/content entrance;
- spring/pressed button feedback;
- desktop hover lift where appropriate;
- animated KPI counters;
- tabs and segmented controls;
- sidebar/drawer and bottom-sheet transitions;
- theme transitions;
- expanding filters/search/command palette;
- loading shimmer and skeleton transitions;
- success/status morphs;
- notification badge changes;
- chart transitions;
- state-machine status transitions.

## Rules

Motion communicates state; it is not decoration for its own sake. Prefer transform and opacity. Avoid continuously animating layout dimensions, large shadows, blur/filter, and top/left coordinates. Ambient animation pauses when the app is hidden/backgrounded. `prefers-reduced-motion` on web and equivalent Flutter accessibility settings must reduce or disable nonessential movement.

## Glass + motion performance

Do not animate large backdrop-filter regions. Keep repaint boundaries intentional, avoid hundreds of permanently promoted GPU layers, and measure on low/mid devices as well as desktop. Flutter animation controllers/tweens must not trigger rebuilding entire scroll surfaces unnecessarily.

## Acceptance

Interactive controls show immediate press/focus state, navigation transitions do not block input, skeletons do not cause major layout shift, scrolling remains smooth with glass enabled, and reduced-motion mode remains fully understandable.
