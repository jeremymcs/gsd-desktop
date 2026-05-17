# S01: Composer Proposal Review Focus - Summary

S01 makes drafted composer ideas actionable from the composer without adding a second approval path.

Implemented:

- Replaced the inert composer Drafted state with a Review proposal action.
- Added proposal focus request state in Plan Builder.
- Focused and centered the existing proposal approval form when Review proposal is clicked.
- Extended Electron coverage for Draft change -> Save draft -> Review proposal.

Verification:

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "starts a change draft from a prepared composer idea"`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
