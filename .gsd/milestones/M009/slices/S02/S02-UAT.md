# S02 UAT: Composer Park Action

## Scenario

A user creates a plan, types a draft for the active DISCUSS question in the bottom composer, and parks it instead of saving it as load-bearing memory.

## Expected

- Composer typing mirrors the active question card draft.
- Parking creates an Idea pool entry.
- The current DISCUSS question remains active.
- Both composer and card draft fields clear after parking.
- Persisted plan state contains a non-load-bearing answer and parked item for the original question.

## Verification

- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "parks the active DISCUSS draft from the Plan Builder composer"`
