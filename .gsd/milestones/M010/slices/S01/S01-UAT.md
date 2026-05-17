# S01 UAT: Composer Question Context

## Scenario

A user creates a plan, starts typing the active DISCUSS answer in the composer, and submits it from the composer.

## Expected

- The composer displays the active question before typing.
- The question remains visible after the user types.
- Submitting advances the composer question to the next DISCUSS prompt.

## Verification

- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "keeps the active DISCUSS question visible inside the Plan Builder composer"`
