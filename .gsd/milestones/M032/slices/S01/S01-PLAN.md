# S01: Cross-Plan Dashboard Rows

**Goal:** Add a compact dashboard for all plans in the workspace.

## Tasks

- [x] Derive summary rows from plan list and selected snapshots.
- [x] Show active phase and next-work summary.
- [x] Link rows to plan selection.
- [x] Cover multi-plan navigation in Electron.

## Acceptance

- A user can identify which plan has ready work without opening each plan.

## Evidence

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "cross-plan dashboard"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists DISCUSS memory"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm run simplify`
- `git diff --check`
