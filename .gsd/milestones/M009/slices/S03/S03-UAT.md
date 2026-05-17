# S03 UAT: Composer Persistence Coverage

## Scenario

A user creates a plan, saves the first DISCUSS answer through the composer, parks the second DISCUSS draft through the composer, closes the app, and reopens it.

## Expected

- The saved answer is visible in Discussion memory after restart.
- The parked draft is visible in the Idea pool after restart.
- The active question remains the parked DISCUSS prompt.
- Persisted state contains exactly two answer records and one parked item.

## Verification

- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "restores composer-submitted answers and parked drafts across restart"`
