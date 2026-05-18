# S01: Active Prompt Regression Guard - Summary

S01 adds regression coverage for the composer-first DISCUSS prompt contract.

Implemented:

- Added a shared Plan Builder Electron assertion that the active DISCUSS prompt appears in the composer and appears only once on the page.
- Asserted workflow guidance does not duplicate the exact active prompt.
- Kept the removed upper question-card path guarded with a zero-count assertion.
- Reused the guard in the active answer submit and active question visibility tests.

Verification:

- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "saves the active DISCUSS answer|keeps the active DISCUSS question visible"`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
