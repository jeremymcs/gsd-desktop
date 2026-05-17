# S01 Summary: Composer Question Context

Made the active DISCUSS question visible inside the Plan Builder composer.

- Added a composer question line above the active composer textarea.
- Changed the textarea placeholder back to answer guidance instead of using the question as disappearing placeholder text.
- Preserved the status-only composer state when no active question is present.
- Added Electron coverage for question text remaining visible while typing and updating after submit.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "keeps the active DISCUSS question visible inside the Plan Builder composer"`
- `git diff --check`
