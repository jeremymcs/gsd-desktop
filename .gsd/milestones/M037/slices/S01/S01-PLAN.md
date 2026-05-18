# S01: Dashboard Health Signals

**Goal:** Add attention signals to each plan dashboard row.

## Tasks

- [x] Compute blockers, recovery stops, and evidence gaps per plan.
- [x] Add compact health text to dashboard rows.
- [x] Preserve row selection behavior.
- [x] Cover multi-plan health states in Electron.

## Acceptance

- Users can spot risky plans without opening each plan.

## Evidence

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "cross-plan dashboard"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm run simplify`
- `git diff --check`
