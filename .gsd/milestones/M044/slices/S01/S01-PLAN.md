# S01: Stop Surface Actions

**Goal:** Promote guardrail warnings into actionable stop/resume UI.

## Tasks

- [x] Classify guardrail warnings as blocking or informational.
- [x] Add recovery or repair actions where the app has deterministic actions.
- [x] Keep normal queue inspection available while autopilot is blocked.
- [x] Cover restart and action behavior in Electron tests.

## Acceptance

- A user can understand why autopilot stopped and choose the next deterministic recovery action.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists run recovery summary"`
- `pnpm --filter @pi-gui/desktop test:e2e:runner -- apps/desktop/tests/core`
- `pnpm lint`
- `pnpm simplify`
