# S03: Draft Change Proposal - Summary

S03 adds draft change proposals as a durable layer between reviewed ideas and active plan mutation. A promotion-ready parked idea can now open an inline proposal form, capture impact notes, and persist a draft proposal without changing accepted plan structure.

Implemented:

- Added `ChangeProposalRecord` and `change.proposal-drafted` planning events.
- Replayed draft proposals into `PlanSnapshot.changeProposals`.
- Added `draftPlanningChangeProposal` through desktop state, IPC, preload, and app store planning methods.
- Added an inline draft proposal form for promotion-ready idea-pool items.
- Added a separate Change proposals outline section.
- Extended planning-store and Electron Plan Builder coverage for proposal persistence.

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
