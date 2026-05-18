# S01: Update Parked Idea Text - Summary

S01 adds append-only editing for parked idea text.

Implemented:

- Added `idea.updated` to the planning event model and SQLite replay.
- Preserved parked idea source metadata and review status while updating the active text.
- Added desktop update wiring through state, IPC, preload, main, app-store, and Plan Builder UI.
- Added an inline idea-pool editor with non-empty text validation.
- Extended Electron coverage to park, edit, prepare, restart, and restore the revised idea text.
- Added planning-store replay coverage for edited parked ideas.

Verification:

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop build`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "reviews newly parked later-phase idea"`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm lint`
- `git diff --check`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
