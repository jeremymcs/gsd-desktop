# S02: Prompt-Guided Stage Framing - Summary

S02 adds prompt-framed workflow guidance to the Plan Builder surface. The UI now shows the current workflow banner, next action, target artifact, and prompt frame for DISCUSS, RESEARCH, PLAN, EXECUTE, VERIFY, and SHIP.

Implemented:

- Added state-derived workflow guidance for pre-plan, DISCUSS, RESEARCH DECISION, RESEARCH, PLAN, EXECUTE, VERIFY, and SHIP states.
- Added a guidance card above the active wizard content.
- Styled the card to match the existing dark, Codex-style Plan Builder interface.
- Extended the Plan Builder Electron spec to assert the guide changes as the workflow advances.

Verification:

- `pnpm --filter @pi-gui/desktop typecheck` passed.
- `pnpm --filter @pi-gui/desktop build` passed.
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts` passed with 2 tests.
- `pnpm typecheck` passed.
- `git diff --check` passed.
- `pnpm run simplify` is blocked because the root package has no `simplify` script.
- `pnpm --filter @pi-gui/desktop run test:e2e:core` verified both Plan Builder specs on the Electron core lane, but the full lane finished with 61 passed and 5 unrelated failures:
  - `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
  - `apps/desktop/tests/core/provider-settings.spec.ts:13`
  - `apps/desktop/tests/core/unread-state.spec.ts:52`
