# S03 UAT: Composer Keyboard Submit

## Scenario

A keyboard user creates a plan, types the first DISCUSS answer in the composer, and presses control-enter.

## Expected

- The answer is saved as load-bearing DISCUSS memory.
- The active question advances to the next DISCUSS prompt.
- Plain multiline textarea behavior remains available outside the command/control-enter shortcut.

## Verification

- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "submits the active DISCUSS answer from the Plan Builder composer keyboard shortcut"`
