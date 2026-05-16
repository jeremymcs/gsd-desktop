# T02: SQLite store and event replay

**Slice:** S01
**Milestone:** M001

## Goal

Implement the repo-local SQLite planning store with append-only events and typed snapshot replay.

## Must-Haves

### Truths

- Opening the store creates `.gsd/gsd.db` and schema metadata.
- Creating a plan stores a named plan with readable numbering and initial revision.
- Appending events increments revision and preserves immutable event history.
- Reopening the store rebuilds the same snapshot from persisted rows.
- Stale `expectedRevision` writes throw a clear revision conflict error.

### Artifacts

- `packages/gsd-planning/src/sqlite-planning-store.ts` - concrete SQLite implementation.
- `packages/gsd-planning/src/index.ts` - exports the SQLite store.

### Key Links

- SQLite events table -> snapshot replay reducer.
- Plan row revision -> append event expected revision guard.
- Requirement events -> typed requirement records in `PlanSnapshot`.

## Steps

1. Add schema creation and schema version metadata.
2. Implement `createPlan`, `listPlans`, `getPlanSnapshot`, and `appendEvent`.
3. Replay events into typed project, requirement, and stage state.
4. Add a specific error class or code for revision conflicts.

## Context

- Use `better-sqlite3` in Node/Electron main process only.
- Do not inspect or mutate this DB directly outside the planning package.

