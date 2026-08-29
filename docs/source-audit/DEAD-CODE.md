# Dead Code / Repository Hygiene Audit

The source repository is a reference, not a migration source tree. The target must not inherit files merely because they exist.

## Observed legacy/repository artifacts that are not to be copied

- committed `.env` file;
- local SQLite database under `db/` and database backups;
- `dev.log` and other logs;
- agent scratch/context directories such as `agent-ctx`;
- `.zscripts` / ad-hoc local scripts not part of the accepted toolchain;
- `tool-results` and generated agent output;
- temporary HTML/images/download artifacts;
- old one-off server/deployment helpers;
- generated build artifacts/caches;
- duplicate/experimental mini-services/examples not justified by the target architecture;
- obsolete Next/Prisma/SQLite wiring after the rewrite;
- unrelated leave/staff/payroll-style v1 features unless later accepted.

## Rule

A source file can migrate only if its **behavior/concept** is valuable and still conforms to the new specification. Even then, prefer a clean implementation in the new architecture over copying framework-coupled code.

## Target repository hygiene

The future foundation must include a strict `.gitignore`, `.env.example`, secret scanning, generated-file policy, clean package boundaries, no checked-in real uploads/local DBs, and documentation explaining which generated contract/codegen outputs are intentionally committed (if any).
