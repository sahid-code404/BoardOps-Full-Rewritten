# BoardOps

BoardOps is being rebuilt from scratch as a production-grade institutional mess operations and accounting ecosystem.

## Current phase

**Phase 05 — Permissions remains open while the reference visual-parity correction is verified.**

Active implementation branch: `phase/05-permissions`.

Phases 01–04 are merged into `main`. The existing application at `sahid-code404/BoardOpsv2rewrite` remains the read-only visual and functional reference; legacy framework code is not copied into the rewrite.

Phase 05 replaces role-name authorization assumptions with one institution-scoped permission engine shared across backend, Web, and Flutter:

- canonical permission codes;
- backend-authoritative exact/all/any permission guards;
- role inheritance plus direct user ALLOW/DENY overrides;
- deterministic DENY precedence;
- institution-scoped role and user-access administration;
- reasoned and audited permission mutations;
- recent STEP_UP verification for high-risk access changes;
- self-lockout protection for `permissions.manage`;
- immutable system-role protection through the custom-role API;
- Web Access Control workspace at `/permissions`;
- Flutter permission policy, visibility, and route-guard primitives;
- local end-to-end permission smoke coverage in CI.

## Reference visual parity correction

Human review identified that the first rewrite presentation preserved the purple/graphite/glass palette but did not preserve the reference composition closely enough. The branch is being corrected against the audited reference commit `77f3dec3b264c42904207f27c5f008b33c03b868`.

The corrected Web direction now preserves the reference rules that matter visually:

- centered compact authentication instead of a marketing split-screen;
- BoardOps/Operations Suite identity inside the strong glass auth card;
- compact segmented Sign in/Register control;
- dense rounded glass inputs and actions;
- animated mesh ambience behind content;
- compact authenticated page chrome and card density instead of oversized landing-page headings.

The complete reusable authenticated shell—menu, search, theme, notifications, profile chrome, responsive navigation, and permission-aware navigation—belongs to Phase 06 and will be implemented as real functionality rather than non-functional visual placeholders.

## Verification status

The permission-engine implementation passed GitHub Actions run `33270844042` across Web/API, authentication + permission E2E smoke, D1 verification, Android, and iOS before this later visual correction.

A new exact-head CI run is required for the visual-parity-corrected branch before local acceptance resumes.

## Local development

Once the branch returns to `RUNNABLE — TEST NOW`, the normal local flow remains intentionally short. This Fedora setup does not require Corepack when `pnpm 11.23.0` is already installed.

Typical commands are:

```bash
git pull --ff-only origin phase/05-permissions
pnpm install --frozen-lockfile
pnpm db:verify:local
pnpm --filter @boardops/api dev
```

Then, in another terminal:

```bash
pnpm auth:smoke:local
pnpm --filter @boardops/web dev
```

Do not use the local testing instructions as an acceptance signal until this README and the Phase 05 history both say `RUNNABLE — TEST NOW` again.

## Security notes

Permission checks are backend-authoritative and fail closed. Client-side visibility is convenience only. Permission mutations are institution-scoped, online-only, audited, reasoned where required, and protected by recent STEP_UP verification for high-risk changes. Web browser sessions remain HttpOnly cookies and Flutter durable tokens remain in OS-backed secure storage.

## Remote deployment warning

Staging/production Cloudflare resources are not provisioned by Phase 05. The D1 IDs in `services/api/wrangler.jsonc` remain deliberate placeholder UUIDs. Do not run remote migrations or deployments until real environment-specific resources are configured.

See `docs/architecture/PERMISSIONS.md`, `docs/decisions/ADR-016-PERMISSION-AUTHORIZATION.md`, `docs/api/CONTRACT.md`, and `docs/implementation-history/PHASE-05-permissions.md` for the Phase 05 design and verification record.

## Checkpoint

NOT READY — CONTINUE FIXING
