# S01: Side-Pane Proposal Review Action - Summary

S01 removes the last inert drafted-proposal state from the idea pool.

Implemented:

- Replaced disabled idea-pool `Drafted` with an active `Review proposal` action.
- Reused the existing proposal focus request path from M016.
- Extended Plan Builder Electron coverage to prove the side-pane handoff focuses the proposal approval field.

Verification:

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "starts a change draft from a prepared composer idea"`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
