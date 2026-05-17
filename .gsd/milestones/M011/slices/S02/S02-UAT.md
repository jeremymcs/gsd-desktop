# S02 UAT: Composer PLAN Handoff

## Scenario

A user completes DISCUSS, starts RESEARCH, stages and accepts research, then uses the bottom composer arrow instead of the card button to start PLAN.

## Expected

- The composer shows the PLAN handoff status.
- Clicking the composer arrow opens the PLAN proposal editor.
- Persisted planning state moves to active phase `plan` and active stage `roadmap`.

## Verification

- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "starts PLAN from the Plan Builder composer handoff"`
