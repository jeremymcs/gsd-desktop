# S01: Composer SHIP Summary Submit - Summary

S01 makes the bottom Plan Builder composer a real closeout input during SHIP.

Implemented:

- Enabled composer text input once SHIP is active.
- Reused the existing `recordShipSummary` path for composer-submitted summaries.
- Cleared and refocused the composer after saving.
- Added focused Electron coverage for saving a SHIP summary from the composer and verifying app state.

Verification:

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "records SHIP summary from the Plan Builder composer"`
