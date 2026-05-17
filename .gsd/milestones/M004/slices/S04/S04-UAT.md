# S04 UAT

## Scenario

1. Open Plan Builder.
2. Create a new plan.
3. Apply workflow preferences.
4. Toggle the app between light and dark themes.
5. Inspect the plan title, answer textarea, workflow preference summary, and phase model selects.

## Expected

- Plan Builder surfaces match the selected theme.
- Text and controls remain readable in both themes.
- Phase model selects do not inherit a dark-only style in light mode.
- Existing Plan Builder persistence still works.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
- Core suite rerun through the desktop test script: 62 passed, 5 failed in pre-existing unrelated specs:
  - `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
  - `apps/desktop/tests/core/provider-settings.spec.ts:13`
  - `apps/desktop/tests/core/unread-state.spec.ts:52`
