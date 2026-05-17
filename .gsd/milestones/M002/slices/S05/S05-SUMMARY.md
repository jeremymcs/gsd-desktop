# S05: SHIP Gate - Summary

S05 completes the M002 execution lifecycle by adding a manual SHIP gate after VERIFY. Plan Builder now requires every accepted task to have passed verification before the user can enter SHIP and save a durable handoff summary.

Implemented:

- Added `ship.summary-recorded` planning events and replayed them into `PlanSnapshot.shipSummaries`.
- Added guarded Electron store actions for starting SHIP and saving ship summaries.
- Exposed narrow IPC/preload/renderer API methods for the new actions.
- Added a SHIP panel with verified task evidence, verification notes, deterministic summary draft, and saved summary state.
- Extended planning-store and Plan Builder Electron coverage for SHIP restart persistence.

Verification:

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm typecheck`
- `git diff --check`

Notes:

- `pnpm run simplify` is required by repo workflow but the script is not defined.
- `pnpm --filter @pi-gui/desktop run test:e2e:core` passed the Plan Builder spec and failed in unrelated existing areas: integrated terminal, new-thread model onboarding/settings, provider settings, and unread state.
