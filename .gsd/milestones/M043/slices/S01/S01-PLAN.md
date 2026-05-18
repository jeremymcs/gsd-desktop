# S01: Autopilot Preflight Action

**Goal:** Add a dedicated autopilot launch surface that uses queue order and guardrail state.

## Tasks

- [x] Derive the first ready queue item and blocking guardrail state in EXECUTE.
- [x] Render an autopilot preflight card before the queue.
- [x] Start or open the first ready task session from the preflight action.
- [x] Cover the preflight in Electron tests.

## Acceptance

- A user can see the next autopilot task, launch it, and verify it uses the same task session behavior as the queue.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "shows next work ordering|persists run recovery summary"`
- `pnpm --filter @pi-gui/desktop test:e2e:runner -- apps/desktop/tests/core`
- `pnpm lint`
- `pnpm simplify`
