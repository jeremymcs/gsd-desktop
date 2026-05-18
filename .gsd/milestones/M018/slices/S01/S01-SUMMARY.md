# S01: Restore Approved Injected Task - Summary

S01 makes hidden approved injected tasks reversible without mutating historical proposal records.

Implemented:

- Added `plan.item-restored` to the planning event model and SQLite replay.
- Added restore wiring through desktop state, IPC, preload, main, app-store, and Plan Builder UI.
- Restores rebuild the accepted PLAN from the approved injection record.
- Extended the long Plan Builder persistence test with hide, restore, hide-again behavior.
- Added planning-store replay coverage for hidden item restoration.

Verification:

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run rebuild:native`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "persists DISCUSS memory plus accepted RESEARCH and PLAN output across restart"`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm lint`
- `git diff --check`
