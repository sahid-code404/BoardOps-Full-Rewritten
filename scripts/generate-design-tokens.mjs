import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokenPath = path.join(root, "packages/design-tokens/tokens.json");
const cssPath = path.join(root, "packages/design-tokens/web/tokens.css");
const dartPath = path.join(root, "apps/mobile/lib/design/design_tokens.dart");
const tokens = JSON.parse(await readFile(tokenPath, "utf8"));
const checking = process.argv.includes("--check");

const kebab = (value) => value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const dartName = (value) => value.replace(/^[^a-zA-Z]+/, "");

function cssTheme(selector, values) {
  const lines = Object.entries(values).map(([key, value]) => `  --bo-color-${kebab(key)}: ${value};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}

function cssNumberGroup(prefix, values, suffix = "px") {
  return Object.entries(values)
    .map(([key, value]) => `  --bo-${prefix}-${kebab(key)}: ${value}${suffix};`)
    .join("\n");
}

function toArgb(hex) {
  const raw = hex.slice(1);
  if (raw.length === 6) return `0xFF${raw.toUpperCase()}`;
  if (raw.length === 8) return `0x${raw.slice(6, 8).toUpperCase()}${raw.slice(0, 6).toUpperCase()}`;
  throw new Error(`Unsupported color token: ${hex}`);
}

function dartMapClass(name, values, formatter) {
  const lines = Object.entries(values).map(
    ([key, value]) => `  static const ${formatter.type} ${dartName(key)} = ${formatter.value(value)};`,
  );
  return `abstract final class ${name} {\n${lines.join("\n")}\n}`;
}

const css = `/* GENERATED FILE — edit packages/design-tokens/tokens.json and run pnpm design:tokens. */\n:root {\n${cssNumberGroup("radius", tokens.radius)}\n${cssNumberGroup("space", tokens.spacing)}\n${cssNumberGroup("type", {
  display: tokens.typography.display,
  headline: tokens.typography.headline,
  title: tokens.typography.title,
  body: tokens.typography.body,
  label: tokens.typography.label,
  caption: tokens.typography.caption,
})}\n${cssNumberGroup("motion", {
  instant: tokens.motion.instant,
  fast: tokens.motion.fast,
  regular: tokens.motion.regular,
  slow: tokens.motion.slow,
  emphasized: tokens.motion.emphasized,
}, "ms")}\n  --bo-motion-ease-standard: ${tokens.motion.easeStandard};\n  --bo-motion-ease-emphasized: ${tokens.motion.easeEmphasized};\n  --bo-glass-blur-soft: ${tokens.glass.blurSoft}px;\n  --bo-glass-blur-regular: ${tokens.glass.blurRegular}px;\n  --bo-glass-blur-strong: ${tokens.glass.blurStrong}px;\n  --bo-glass-saturation: ${tokens.glass.saturation};\n  --bo-shadow-sm: ${tokens.shadow.sm};\n  --bo-shadow-md: ${tokens.shadow.md};\n  --bo-shadow-lg: ${tokens.shadow.lg};\n  --bo-breakpoint-compact: ${tokens.breakpoints.compact}px;\n  --bo-breakpoint-medium: ${tokens.breakpoints.medium}px;\n  --bo-breakpoint-expanded: ${tokens.breakpoints.expanded}px;\n  --bo-breakpoint-wide: ${tokens.breakpoints.wide}px;\n  --bo-touch-target: ${tokens.touchTarget}px;\n}\n\n${cssTheme(':root, [data-theme="light"]', tokens.colors.light)}\n\n${cssTheme('[data-theme="dark"]', tokens.colors.dark)}\n\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${Object.entries(tokens.colors.dark)
  .map(([key, value]) => `    --bo-color-${kebab(key)}: ${value};`)
  .join("\n")}\n  }\n}\n`;

const dart = `// GENERATED FILE — edit packages/design-tokens/tokens.json and run pnpm design:tokens.\n\n${dartMapClass("BoardOpsLightColors", tokens.colors.light, { type: "int", value: toArgb })}\n\n${dartMapClass("BoardOpsDarkColors", tokens.colors.dark, { type: "int", value: toArgb })}\n\n${dartMapClass("BoardOpsRadius", tokens.radius, { type: "double", value: (value) => `${Number(value).toFixed(1)}` })}\n\n${dartMapClass("BoardOpsSpacing", tokens.spacing, { type: "double", value: (value) => `${Number(value).toFixed(1)}` })}\n\nabstract final class BoardOpsMotion {\n  static const Duration instant = Duration(milliseconds: ${tokens.motion.instant});\n  static const Duration fast = Duration(milliseconds: ${tokens.motion.fast});\n  static const Duration regular = Duration(milliseconds: ${tokens.motion.regular});\n  static const Duration slow = Duration(milliseconds: ${tokens.motion.slow});\n  static const Duration emphasized = Duration(milliseconds: ${tokens.motion.emphasized});\n}\n\nabstract final class BoardOpsBreakpoints {\n  static const double compact = ${tokens.breakpoints.compact}.0;\n  static const double medium = ${tokens.breakpoints.medium}.0;\n  static const double expanded = ${tokens.breakpoints.expanded}.0;\n  static const double wide = ${tokens.breakpoints.wide}.0;\n}\n\nabstract final class BoardOpsGlass {\n  static const double blurSoft = ${tokens.glass.blurSoft}.0;\n  static const double blurRegular = ${tokens.glass.blurRegular}.0;\n  static const double blurStrong = ${tokens.glass.blurStrong}.0;\n}\n\nabstract final class BoardOpsAccessibility {\n  static const double minimumTouchTarget = ${tokens.touchTarget}.0;\n}\n`;

async function syncFile(filePath, expected) {
  if (checking) {
    const actual = await readFile(filePath, "utf8");
    if (actual !== expected) {
      throw new Error(`${path.relative(root, filePath)} is stale. Run pnpm design:tokens.`);
    }
    return;
  }
  await writeFile(filePath, expected);
}

await Promise.all([syncFile(cssPath, css), syncFile(dartPath, dart)]);
console.log(checking ? "Design tokens are synchronized." : "Design tokens generated.");
