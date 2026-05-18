# S01: Update Draft Proposal Details - Summary

S01 adds append-only detail editing for draft change proposals.

Implemented:

- Added `change.proposal-updated` to the planning event model and SQLite replay.
- Added desktop update wiring through state, IPC, preload, main, app-store, and Plan Builder UI.
- Added draft-only validation for proposal detail updates.
- Added an inline draft detail editor for proposal title, summary, and impact notes.
- Kept injection and modification editors out of the way while detail edits are active.
- Extended composer change-draft Electron coverage to edit a replacement draft and restore revised details after restart.
- Added planning-store replay coverage for updated proposal details.

Verification:

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run rebuild:native`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "starts a change draft from a prepared composer idea"`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `git diff --check`
