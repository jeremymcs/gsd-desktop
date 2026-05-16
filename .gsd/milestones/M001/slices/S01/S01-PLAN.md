# S01: Planning Engine Foundation

**Goal:** Create the shared planning package that owns the repo-local SQLite database, append-only events, typed snapshots, requirement records, and revision checks.
**Demo:** From package tests, a temporary workspace can create `.gsd/gsd.db`, create a named plan, append events, reopen the store, read the same typed snapshot, and reject stale writes.

## Must-Haves

- `@pi-gui/gsd-planning` exists as a workspace package with TypeScript build output and public exports.
- Opening a workspace initializes `.gsd/gsd.db` with schema versioning.
- A named plan can be created for a root workspace and listed/reopened after process restart.
- User/project/requirement events append to an immutable event log and rebuild a typed `PlanSnapshot`.
- Requirement records support stable `R###` IDs, status, class, owner, source, and validation state.
- Mutations require the caller's expected revision and fail loudly on stale revision.
- Tests cover create/open, event replay after reopen, requirements, and stale revision rejection.

## Tasks

- [x] **T01: Package scaffold and types**
  Create `packages/gsd-planning` with package metadata, TypeScript config, exported domain types, and the `PlanningStore` interface.

- [x] **T02: SQLite store and event replay**
  Implement schema initialization, store opening, plan creation/listing, event append, typed snapshot replay, and optimistic revision checks.

- [x] **T03: Package tests and workspace wiring**
  Add focused package tests, wire build/test scripts, add the SQLite dependency, and run focused verification.

## Files Likely Touched

- `packages/gsd-planning/package.json`
- `packages/gsd-planning/tsconfig.json`
- `packages/gsd-planning/src/index.ts`
- `packages/gsd-planning/src/types.ts`
- `packages/gsd-planning/src/sqlite-planning-store.ts`
- `packages/gsd-planning/test/*.test.mjs`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
