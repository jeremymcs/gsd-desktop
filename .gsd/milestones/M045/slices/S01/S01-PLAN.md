# S01: Dashboard Conflict Signals

**Goal:** Add deterministic cross-plan conflict signals to the dashboard.

## Tasks

- [x] Define local conflict signals that do not require model judgment.
- [x] Compute conflict counts for dashboard rows.
- [x] Render compact conflict text and preserve plan switching.
- [x] Cover conflict signals in Electron tests.

## Acceptance

- A user can spot likely cross-plan conflicts without opening every plan.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "cross-plan dashboard"`
- `pnpm --filter @pi-gui/desktop test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "cross-plan dashboard|archives and restores"`
- `pnpm --filter @pi-gui/desktop test:e2e:runner -- apps/desktop/tests/core`
- `pnpm lint`
- `pnpm simplify`
