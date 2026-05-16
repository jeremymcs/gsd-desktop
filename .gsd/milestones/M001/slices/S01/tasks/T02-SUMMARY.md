---
milestone: M001
slice: S01
task: T02
status: done
---

# T02 Summary: SQLite store and event replay

Implemented the repo-local SQLite planning store behind the `PlanningStore` interface.

## Built

- `openPlanningStore({ workspaceRoot })` creates `.gsd/gsd.db`.
- `.gitignore` receives `.gsd/gsd.db` when the database is created.
- SQLite schema includes schema metadata, plans, and append-only plan events.
- Store supports plan creation, plan listing, snapshot loading, event append, and close.
- Snapshot replay rebuilds project state, stage state, answer history, requirement records, and staged generated outputs.
- `PlanningRevisionConflictError` fails stale writes loudly.

## Verification

- Package tests prove create/open, replay after reopen, requirement state, and stale revision rejection.
- Covered by `pnpm --filter @pi-gui/gsd-planning test`.
- Covered by `pnpm typecheck`.

## Follow-Up

- S02 should add projection generation and legacy-file ownership checks without bypassing this store API.

