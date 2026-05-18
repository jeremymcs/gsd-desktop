# S01: Projection Repair Controls

**Goal:** Add targeted repair actions for projection drift and conflicts.

## Tasks

- [x] Route drift to normal regeneration.
- [x] Route legacy conflicts to explicit overwrite.
- [x] Surface repair actions near projection and guardrail state.
- [x] Cover repair paths in Electron tests.

## Acceptance

- A user can repair generated projections without guessing which action is safe.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists run recovery summary"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists DISCUSS memory"`
