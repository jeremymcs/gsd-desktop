# S01: Withdraw Draft Proposal - Summary

S01 adds non-destructive draft deletion for change proposals.

Implemented:

- Added `withdrawn` change proposal status.
- Added `change.proposal-withdrawn` to the planning event model and SQLite replay.
- Added desktop withdrawal wiring through state, IPC, preload, main, app-store, and Plan Builder UI.
- Updated active proposal lookup so withdrawn drafts do not block replacement drafts.
- Extended composer change-draft Electron coverage to delete a draft, create a replacement, and restore both after restart.
- Added planning-store replay coverage for withdrawn proposals.

Verification:

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run rebuild:native`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "starts a change draft from a prepared composer idea"`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm lint`
- `git diff --check`
