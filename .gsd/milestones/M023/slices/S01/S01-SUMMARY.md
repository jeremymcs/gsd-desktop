# S01 Summary: Proposal Activity Projection

## Completed

- Added derived proposal activity records to planning snapshots.
- Replayed activity from proposal drafted, updated, withdrawn, approved, task-modified, task-hidden, and task-restored events.
- Kept lifecycle history derived from the append-only event stream instead of adding mutable activity events.
- Added package replay coverage for activity order, target paths, accepted output IDs, statuses, and reopen behavior.

## Verification

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm lint`
- `git diff --check`
