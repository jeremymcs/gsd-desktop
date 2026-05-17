# S04: VERIFY Gate - Summary

S04 adds a manual VERIFY gate after EXECUTE. Plan Builder now requires accepted tasks to be done with evidence before entering VERIFY, then lets the user record pass/fail checks against each task's acceptance criteria.

Implemented:

- Added `task.verification-recorded` planning events and replayed them into `PlanSnapshot.taskVerifications`.
- Added guarded Electron store actions for starting VERIFY and saving task verification.
- Exposed narrow IPC/preload/renderer API methods for the new actions.
- Added a VERIFY panel with acceptance text, execution evidence, pass/fail controls, notes, and ready-to-ship signal.
- Extended planning-store and Plan Builder Electron coverage for verification persistence after restart.

Verification:

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm typecheck`
- `git diff --check`

Notes:

- `pnpm run simplify` is required by repo workflow but the script is not defined.
- `pnpm --filter @pi-gui/desktop run test:e2e:core` passed the Plan Builder spec and failed in unrelated existing areas: integrated terminal, new-thread auto-title timing, new-thread model onboarding/settings, provider settings, and unread state.
