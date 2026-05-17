# S01: First-Class Idea Pool - Summary

S01 turns parked discussion notes into first-class planning records. The Plan Builder now records a parked item whenever the user clicks `Park`, links it to the source answer metadata, and shows it in a separate idea pool in the outline.

Implemented:

- Added `idea.parked` planning events and replayed them into `PlanSnapshot.parkedItems`.
- Linked parked items to the non-load-bearing source answer ID, stage, question, prompt, text, and rationale.
- Kept parked notes out of discussion memory so they do not count as load-bearing answers.
- Added an idea-pool panel to the Plan Builder outline.
- Extended planning-store and Plan Builder Electron coverage for restart persistence.

Verification:

- `pnpm --filter @pi-gui/gsd-planning test` passed.
- `pnpm --filter @pi-gui/desktop typecheck` passed.
- `pnpm --filter @pi-gui/desktop build` passed.
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts` passed with 2 tests.
- `pnpm typecheck` passed.
- `git diff --check` passed before doc closeout.
- `pnpm run simplify` is blocked because the root package has no `simplify` script.
- `pnpm --filter @pi-gui/desktop run test:e2e:core` verified the Plan Builder specs on the Electron core lane, but the full lane finished with 61 passed and 5 unrelated failures:
  - `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
  - `apps/desktop/tests/core/provider-settings.spec.ts:13`
  - `apps/desktop/tests/core/unread-state.spec.ts:52`
