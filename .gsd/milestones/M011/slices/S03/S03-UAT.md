# S03 UAT: Composer EXECUTE Handoff

## Scenario

A user completes DISCUSS, accepts research, stages and accepts a valid plan, then uses the bottom composer arrow to start EXECUTE.

## Expected

- The composer shows the EXECUTE handoff status.
- Clicking the composer arrow opens the EXECUTE queue.
- Persisted planning state moves to active phase `execute` and active stage `task`.

## Verification

- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "starts EXECUTE from the Plan Builder composer handoff"`
