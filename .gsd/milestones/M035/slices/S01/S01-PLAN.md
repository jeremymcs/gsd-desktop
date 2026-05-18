# S01: Recovery Resume Action

**Goal:** Add a primary action to resume or open the recovery target.

## Tasks

- [x] Derive the recovery target entry from the accepted plan.
- [x] Add a resume/open button to the recovery summary.
- [x] Reuse linked-session behavior instead of creating duplicate sessions.
- [x] Cover restart behavior in Electron.

## Acceptance

- A user can click the recovery summary to resume the stored target after relaunch.

## Evidence

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "run recovery summary"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm run simplify`
- `git diff --check`
