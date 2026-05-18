# S01: Model Policy Comparison UI

**Goal:** Polish visibility around global and project phase model policy.

## Tasks

- [x] Show global defaults beside project overrides where phase routing is configured.
- [x] Keep task-session resolved model labels unchanged.
- [x] Add missing-route messaging for unset phases.
- [x] Cover model policy comparison in Electron tests.

## Acceptance

- A user can tell which model each phase will use and where that decision came from.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists DISCUSS memory"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/timeline-pinning.spec.ts --grep "keeps a reopened virtualized long transcript stable"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/new-thread-auto-title.spec.ts --grep "manual rename beats"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/queued-messages.spec.ts --grep "delineates queued follow-ups"`
- `pnpm lint`
- `pnpm simplify`
- `git diff --check`
