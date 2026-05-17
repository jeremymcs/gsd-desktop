# S04: Approved Injection - Summary

S04 adds the approval path from draft proposal to active plan change. A draft proposal can now be approved from the Plan Builder outline, target an existing slice, add a task, and produce a new accepted roadmap output while preserving the original accepted plan history.

Implemented:

- Added `ApprovedPlanInjectionRecord` and `change.proposal-approved` planning events.
- Replayed approved proposals and injections into `PlanSnapshot.changeProposals` and `PlanSnapshot.approvedInjections`.
- Added `approvePlanningChangeProposal` through desktop state, IPC, preload, and app store planning methods.
- Added validation so approvals require a draft proposal, accepted plan, target slice, unique task ID, valid dependencies, and valid plan output.
- Switched execution/verification helpers to use the latest accepted roadmap output.
- Added an approval form to the Change proposals outline card.
- Regenerated projections automatically after approval.
- Extended planning-store and Electron Plan Builder coverage through EXECUTE, VERIFY, SHIP, restart, and generated projection checks.

Verification:

- `pnpm --filter @pi-gui/gsd-planning test` passed.
- `pnpm --filter @pi-gui/desktop typecheck` passed.
- `pnpm --filter @pi-gui/desktop build` passed.
- `pnpm exec cross-env PI_APP_TEST_MODE=background pnpm exec playwright test -c apps/desktop/playwright.config.ts apps/desktop/tests/core/plan-builder.spec.ts` passed with 2 tests.
- `pnpm typecheck` passed.
- `git diff --check` passed before doc closeout.
- `pnpm run simplify` is blocked because the root package has no `simplify` script.
- `pnpm --filter @pi-gui/desktop test:e2e:core` verified both Plan Builder specs on the Electron core lane, but the full lane finished with 61 passed and 5 unrelated failures:
  - `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
  - `apps/desktop/tests/core/provider-settings.spec.ts:13`
  - `apps/desktop/tests/core/unread-state.spec.ts:52`
