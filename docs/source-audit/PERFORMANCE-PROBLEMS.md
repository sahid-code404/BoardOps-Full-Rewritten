# Performance Problems / Performance Baseline

## Legacy risks

### P-01 — Filesystem read/write on every rate-limit check

The legacy limiter synchronously reads `/tmp` on each request and may write frequently. Besides Worker incompatibility, this is avoidable blocking I/O.

### P-02 — Per-resident N+1 bill generation

Legacy bill calculation iterates residents and performs resident-specific meal/bill operations inside the loop. This will scale poorly as resident/history size grows.

**Target:** D1 queries/aggregations are planned around bounded batches/set operations, with indexes and measured query plans.

### P-03 — Ledger latest-row reads under write load

Repeated `ORDER BY createdAt DESC` latest-balance queries create both correctness and performance pressure. The target chooses a concurrency-safe account/ledger strategy with indexes and reconciliation.

### P-04 — Heavy glass/motion risk

Legacy UI already had to reduce backdrop filtering in places. The correct target response is not to delete glass, but to bound blur regions, nested layers, repaint areas, shadows, and scrolling effects.

### P-05 — Large SPA surface

Many feature views/components in one legacy application increase initial JS and accidental cross-feature coupling.

**Target:** route/workspace code splitting, lazy heavy reports/charts/editors, tree-shakeable icons, no bulk dependencies.

## Target budgets/gates

Exact numeric performance budgets will be finalized in Phase 01 after a real shell exists, but CI must eventually enforce:

- bounded web initial bundle and route chunks;
- no accidental giant report/chart/editor code in resident initial route;
- responsive interaction on representative mid-range mobile hardware;
- smooth scroll with glass enabled;
- bounded D1 queries with required indexes;
- no unbounded list endpoints;
- pagination/cursor for history/search/audit;
- background work moved to Queues/Workflows when it should not block request latency;
- Flutter list virtualization and bounded rebuild scopes;
- offline sync batches/retries with backoff.

Performance optimization must preserve correctness and visual intent.
