# S03: Composer Draft Focus Handoff - Summary

S03 keeps the keyboard flow intact after the composer opens a change draft.

Implemented:

- Added a ref for the active change-draft title input.
- Focused and centered the existing draft form when `draftingIdeaId` changes.
- Extended Electron coverage so the composer Draft change handoff asserts focus before saving.

Verification:

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts -g "starts a change draft from a prepared composer idea"`
- `PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core` reached 84 passed, with unrelated failures in `mentions-diff.spec.ts` and `new-thread-auto-title.spec.ts`; both failed specs passed on immediate isolated rerun.
