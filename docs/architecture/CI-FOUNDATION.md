# CI Foundation — Phase 01

GitHub Actions verifies the architecture branch on every push/PR.

Current Phase 01 gates:

- Node/pnpm dependency resolution
- formatting
- ESLint
- TypeScript type checks
- Web/API unit tests
- Web/API builds
- Wrangler Worker binding type generation
- Flutter dependency resolution
- Flutter analyze
- Flutter widget/unit tests
- Android debug build after materializing the standard Flutter Android platform scaffold
- iOS no-codesign compile validation on a macOS runner after materializing the standard Flutter iOS scaffold

The platform-scaffold generation is deliberately mechanical Flutter output; BoardOps application code remains in `apps/mobile/lib`. Lockfiles are captured after the first successful resolution and then committed so later CI can switch to frozen installs.
