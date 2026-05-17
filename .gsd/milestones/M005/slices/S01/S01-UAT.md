# S01 UAT: Project Shape Capture

## Scenario

1. Open Plan Builder.
2. Create a new plan.
3. Answer the project DISCUSS questions through the project depth gate.
4. Generate or regenerate projections.
5. Inspect `.gsd/PROJECT.md`.

## Expected

- The project DISCUSS flow asks `Is this project simple or complex?`.
- The generated Project projection includes `## Project Shape`.
- `**Complexity:**` matches the saved classification.
- `**Why:**` contains the user's rationale.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
