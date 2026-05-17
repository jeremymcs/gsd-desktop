# S06: Approved Modification - Summary

S06 adds the missing modify path to Plan Change Control. A draft change proposal can now update an existing task's title, acceptance, and dependencies while keeping the task ID/path stable and preserving older accepted roadmap output.

Implemented:

- Added `ApprovedPlanModificationRecord` and `change.proposal-modification-approved`.
- Replayed approved modifications into `PlanSnapshot.approvedModifications`.
- Added `approvePlanningTaskModification` through desktop state, IPC, preload, and app store planning methods.
- Added validation so modifications require a draft proposal, accepted plan, target task, title, acceptance, and valid dependencies.
- Added a modification form to draft change proposal cards.
- Added approved modification evidence to proposal cards.
- Generated a new accepted roadmap output titled `Modified task - <task path>`.
- Regenerated projections from the latest accepted roadmap output.
- Made VERIFY/SHIP ignore stale verification records whose saved acceptance no longer matches current task acceptance.
- Extended planning-store and Electron Plan Builder coverage for modification, projections, restart state, and lifecycle gates.

Verification:

- `pnpm --filter @pi-gui/gsd-planning test` passed.
- `pnpm --filter @pi-gui/desktop typecheck` passed.
- `pnpm --filter @pi-gui/desktop build` passed.
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts` passed with 2 tests.
- `pnpm typecheck` passed.
- `git diff --check` passed before doc closeout.
- `pnpm run simplify` is blocked because the root package has no `simplify` script.
- `pnpm --filter @pi-gui/desktop test:e2e:core` verified both Plan Builder specs on the Electron core lane, but the full lane finished with 60 passed and 6 unrelated failures:
  - `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
  - `apps/desktop/tests/core/new-thread-auto-title.spec.ts:194`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
  - `apps/desktop/tests/core/provider-settings.spec.ts:13`
  - `apps/desktop/tests/core/unread-state.spec.ts:52`
