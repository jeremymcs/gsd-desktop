# S01 UAT: Composer RESEARCH Handoff

## Scenario

A user completes DISCUSS, confirms all depth gates, then uses the bottom composer arrow instead of the card button to start RESEARCH.

## Expected

- The composer shows the RESEARCH handoff status.
- The composer action is enabled only when the normal Start research action is allowed.
- Clicking the composer arrow opens the RESEARCH panel.
- Persisted planning state moves to active phase/stage `research`.

## Verification

- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "starts RESEARCH from the Plan Builder composer handoff"`
