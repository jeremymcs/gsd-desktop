# S02: Idea Review Actions - Summary

S02 adds explicit review decisions to the idea pool. Parked items now replay with a `reviewStatus`, and the Plan Builder UI can mark each item as kept, dismissed, or ready to promote without changing the active plan.

Implemented:

- Added `ParkedItemReviewStatus` and `idea.reviewed` planning events.
- Replayed review events into `PlanSnapshot.parkedItems`.
- Added `reviewPlanningIdea` through desktop state, IPC, preload, and app store planning methods.
- Added Keep, Prepare, and Dismiss actions in the Plan Builder idea pool.
- Extended planning-store and Electron Plan Builder coverage for review persistence.

Verification:

- `pnpm --filter @pi-gui/gsd-planning test` passed.
- `pnpm --filter @pi-gui/desktop typecheck` passed.
- `pnpm --filter @pi-gui/desktop build` passed.
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts` passed with 2 tests after the desktop rebuild restored Electron-native modules.
- `pnpm typecheck` passed.
- `git diff --check` passed.
- `pnpm run simplify` is blocked because the root package has no `simplify` script.
- `pnpm --filter @pi-gui/desktop run test:e2e:core` verified the Plan Builder specs on the Electron core lane, but the full lane finished with 61 passed and 5 unrelated failures:
  - `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
  - `apps/desktop/tests/core/provider-settings.spec.ts:13`
  - `apps/desktop/tests/core/unread-state.spec.ts:52`
