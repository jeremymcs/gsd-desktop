# S02: Prompt Context Cleanup - Summary

S02 separates active composer prompt naming from follow-up and memory prompt naming.

Implemented:

- Renamed the active DISCUSS prompt test id from `plan-question-prompt` to `plan-composer-prompt`.
- Updated Plan Builder Electron coverage to use the composer-specific prompt id.
- Left adaptive follow-up prompts on `adaptive-follow-up-question`.
- Left saved discussion memory prompts on `plan-memory-question`.
- Kept the removed upper question-card path covered by the M021/S01 absence assertion.

Verification:

- `pnpm --filter @pi-gui/desktop build`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
