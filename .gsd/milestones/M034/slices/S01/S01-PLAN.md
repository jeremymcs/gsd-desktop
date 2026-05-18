# S01: Run Recovery Summary

**Goal:** Persist and project the last autonomous run stop point.

## Tasks

- [x] Add run recovery summary state.
- [x] Show stop reason and resume target in Plan Builder.
- [x] Include recovery summary in `.gsd/NEXT.md`.
- [x] Cover partial-progress restart behavior.

## Acceptance

- A new session can resume from the projected recovery summary.

## Evidence

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "run recovery summary"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm run simplify`
- `git diff --check`
