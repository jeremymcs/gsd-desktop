# S01: Archive And Restore Plan

**Goal:** Add safe plan archive and restore controls.

## Tasks

- [x] Add plan status event support.
- [x] Filter archived plans from the active dashboard.
- [x] Provide restore access for archived plans.
- [x] Cover archive/restore restart behavior.

## Acceptance

- Archived plans do not clutter active work but remain recoverable.

## Evidence

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/gsd-planning build && pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "archives and restores"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm run simplify`
- `git diff --check`
