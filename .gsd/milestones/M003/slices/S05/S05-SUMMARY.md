# S05: Removal and Hidden State - Summary

S05 adds append-only removal semantics for active plan tasks. A user can hide an approved injected task with a reason, produce a new accepted roadmap output without that task, and regenerate active Markdown projections without rewriting historical accepted output.

Implemented:

- Added `HiddenPlanItemRecord`, `plan.item-hidden`, and `PlanSnapshot.hiddenPlanItems`.
- Replayed hidden-task events through the SQLite planning snapshot projection.
- Added `hidePlanningTask` through desktop state, IPC, preload, app store, and planning store methods.
- Added validation so hiding requires a current accepted plan, a valid task path, a non-empty reason, and at least one remaining task in the slice.
- Added a hide form to approved change proposals with injected task paths.
- Added hidden-state UI when an approved injected task is no longer active.
- Created a new accepted roadmap output for hidden-task changes while preserving older accepted output history.
- Regenerated projections from the latest active accepted plan.
- Removed stale generated projection files when hidden tasks no longer project to Markdown.
- Extended planning-store, projection, and Electron Plan Builder coverage for hide, restart, and active-output behavior.

Verification:

- `pnpm --filter @pi-gui/gsd-planning test` passed.
- `pnpm --filter @pi-gui/desktop typecheck` passed.
- `pnpm --filter @pi-gui/desktop build` passed.
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts` passed with 2 tests.
- `pnpm typecheck` passed.
- `git diff --check` passed before doc closeout.
- `pnpm run simplify` is blocked because the root package has no `simplify` script.
- `pnpm --filter @pi-gui/desktop test:e2e:core` verified both Plan Builder specs on the Electron core lane, but the full lane finished with 61 passed and 5 unrelated failures:
  - `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
  - `apps/desktop/tests/core/provider-settings.spec.ts:13`
  - `apps/desktop/tests/core/unread-state.spec.ts:52`
