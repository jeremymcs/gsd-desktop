# S02: Composer Change-Draft Handoff - Summary

S02 lets prepared composer ideas continue into the existing change-draft workflow.

Implemented:

- Added Draft change to the composer review follow-up when the parked idea is ready to promote.
- Reused `changeProposalsBySource` so a prepared idea cannot draft duplicate proposals.
- Opened the existing idea-pool draft form instead of adding a second composer-only editor.
- Added Electron coverage for parking, preparing, opening the draft form, saving a change proposal, and restoring it after restart.

Verification:

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "starts a change draft from a prepared composer idea"`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
