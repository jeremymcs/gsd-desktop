# S01 Summary: Compute Next Work Items

S01 adds a pure next-work queue helper to the shared planning package.

## Shipped

- `computeNextWorkQueue` derives ready and blocked work from task facts.
- Dependency blockers include the blocking task id/path and reason.
- Done, passed verification, hidden, shipped, and ship-complete work is excluded.
- Explicit blocked task status remains visible as blocked context.
- Queue order follows the accepted task order from the caller.

## Verification

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
