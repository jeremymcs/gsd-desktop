# S02 Summary: Composer Park Action

Implemented composer parking for active DISCUSS drafts.

- Added a Park action beside the composer send button.
- Reused the existing non-load-bearing answer path, which also creates the parked idea record.
- Kept the active DISCUSS prompt in place after parking.
- Added Electron coverage for the visible composer parking path and persisted parked state.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "parks the active DISCUSS draft from the Plan Builder composer"`
- `git diff --check`
