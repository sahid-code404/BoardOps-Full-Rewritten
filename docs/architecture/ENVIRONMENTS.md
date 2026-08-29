# Environment Model

BoardOps uses three isolated environments: `development`, `staging`, and `production`.

Each environment has independent D1, R2, queues, workflows, rate-limit configuration, secrets, domains, notification providers, and mobile OTA channels. Production data is never reused for development.

## Phase 03 Cloudflare resource names

Development:

- D1: `boardops-development`
- R2: `boardops-files-development`
- Queue: `boardops-events-development`
- DLQ: `boardops-events-development-dlq`
- Workflow: `boardops-foundation-workflow-development`

Staging:

- D1: `boardops-staging`
- R2: `boardops-files-staging`
- Queue: `boardops-events-staging`
- DLQ: `boardops-events-staging-dlq`
- Workflow: `boardops-foundation-workflow-staging`

Production:

- D1: `boardops-production`
- R2: `boardops-files-production`
- Queue: `boardops-events-production`
- DLQ: `boardops-events-production-dlq`
- Workflow: `boardops-foundation-workflow-production`

## Resource identifiers and secrets

The repository contains names and non-secret configuration only. The checked-in D1 `database_id` values are deliberate placeholder UUIDs for the Phase 03 foundation; they are not real remote databases.

Before any staging/production migration or deployment:

1. provision the corresponding Cloudflare resources;
2. replace each placeholder D1 ID with the real non-secret resource ID for that environment;
3. configure required secrets in platform secret storage, never in Git;
4. verify environment bindings before applying migrations.

Local web/API development uses Vite/Wrangler/workerd. Local D1 uses Wrangler's local state and does not require a real remote database ID. Flutter consumes an explicit development API URL and runs independently.
