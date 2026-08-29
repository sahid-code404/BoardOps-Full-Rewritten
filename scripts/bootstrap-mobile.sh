#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/apps/mobile"

flutter --version
flutter pub get
flutter create --platforms=android,ios --project-name boardops --org com.sahidcode404 .
flutter analyze
flutter test

echo "Flutter platform scaffolds are ready. Run: cd apps/mobile && flutter run"
