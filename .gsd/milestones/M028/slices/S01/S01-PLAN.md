# S01: Persist Run Policy Defaults

**Goal:** Store and show conservative autonomous-run policy defaults.

## Tasks

- [x] Extend planning preferences with run-policy fields.
- [x] Show the policy near the execution queue.
- [x] Include the policy in `.gsd/NEXT.md`.
- [x] Cover persistence and projection output in tests.

## Acceptance

- Policy survives restart.
- Projection text is enough for another session to know when to stop.

## Evidence

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "shows next work ordering|persists DISCUSS memory"`
