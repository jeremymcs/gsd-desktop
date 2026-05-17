# S01: Workflow Preferences Bootstrap - Summary

S01 adds the first database-backed workflow preference path to Plan Builder. A user can apply the recommended workflow defaults from the UI, and Plan Builder writes both human-readable and runtime preference projections from `.gsd/gsd.db`.

Implemented:

- Added `WorkflowPreferencesRecord` and `workflow.preferences-updated`.
- Replayed workflow preferences into `PlanSnapshot.workflowPreferences`.
- Added workflow preference projection writing for `.gsd/PREFERENCES.md`.
- Added runtime research decision projection writing for `.gsd/runtime/research-decision.json`.
- Added desktop state, IPC, preload, main-process, and app-store wiring for applying defaults.
- Added a Plan Builder workflow preferences card with unsaved and saved states.
- Extended planning-store coverage for replay and restart persistence.
- Extended projection coverage for preference and runtime files.
- Extended the Plan Builder Electron spec to apply defaults and prove restart persistence.

Verification:

- `pnpm --filter @pi-gui/gsd-planning test` passed.
- `pnpm --filter @pi-gui/desktop typecheck` passed.
- `pnpm --filter @pi-gui/desktop build` passed.
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts` passed with 2 tests.
- `pnpm typecheck` passed.
- `git diff --check` passed.
- `pnpm run simplify` is blocked because the root package has no `simplify` script.
- `pnpm --filter @pi-gui/desktop run test:e2e:core` verified both Plan Builder specs on the Electron core lane, but the full lane finished with 61 passed and 5 unrelated failures:
  - `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
  - `apps/desktop/tests/core/provider-settings.spec.ts:13`
  - `apps/desktop/tests/core/unread-state.spec.ts:52`
