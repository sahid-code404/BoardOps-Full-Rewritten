# Environment Model

BoardOps uses three isolated environments: `development`, `staging`, and `production`.

Each environment has independent D1, R2, queues, workflows, rate-limit configuration, secrets, domains, notification providers and mobile OTA channels. Production data is never reused for development.

Phase 01 commits names/placeholders only. Real credentials stay in Cloudflare/GitHub/Shorebird/platform secret stores and local untracked environment files.

Local web/API development uses Vite/Wrangler/workerd. Flutter consumes an explicit development API URL and runs independently.
