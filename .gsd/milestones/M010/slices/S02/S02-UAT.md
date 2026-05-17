# S02 UAT: Composer Focus Retention

## Scenario

A user saves an answer from the composer, then parks a draft from the composer on the next active DISCUSS question.

## Expected

- After save, the next active question is shown and the composer textarea is focused.
- After park, the current active question remains shown and the composer textarea is focused.
- Existing card controls remain available.

## Verification

- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "keeps focus in the Plan Builder composer after submit and park"`
