# S05 UAT

## Scenario

1. Create a plan in Plan Builder.
2. Answer the first DISCUSS question.
3. Open the Discussion memory section.
4. Edit the saved answer.
5. Restart the app and reopen the plan.

## Expected

- The memory card heading still shows the compact answer label, such as `Name`.
- The card also shows the exact source question, such as `What should we call this project?`.
- The source question remains visible while editing the answer.
- The same question context is restored after restart.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
