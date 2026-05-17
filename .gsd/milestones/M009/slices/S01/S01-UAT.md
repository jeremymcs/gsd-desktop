# S01 UAT: Composer Answer Submit

## Scenario

A user creates a plan, answers the active DISCUSS question from the bottom Plan Builder composer, and submits it with the send button.

## Expected

- Composer typing mirrors the active question answer draft.
- Composer submit saves the answer as load-bearing DISCUSS memory.
- The active question advances to the next DISCUSS prompt.
- Persisted plan state keeps the original prompt with the saved answer.

## Verification

- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "saves the active DISCUSS answer from the Plan Builder composer"`
