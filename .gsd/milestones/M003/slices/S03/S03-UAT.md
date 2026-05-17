# S03: Draft Change Proposal - UAT

## Scenario

A user parks a note, marks it ready to promote, drafts a change proposal with impact notes, completes the workflow, and restarts the app.

## Result

Passed.

Evidence:

- A promotion-ready idea exposes `Draft change`.
- The draft form captures title, summary, and impact notes.
- Saving the draft creates a separate Change proposals entry.
- The idea remains in the idea pool and active plan structure is not mutated.
- Restarted Plan Builder still shows the draft proposal.
- App state includes the proposal in `selectedPlan.changeProposals`.

The targeted Plan Builder Electron spec passed with 2 tests.

The full Electron core lane also ran. Both Plan Builder specs passed in that lane, and the lane finished with 61 passed and 5 failures outside the Plan Builder surface:

- `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
- `apps/desktop/tests/core/provider-settings.spec.ts:13`
- `apps/desktop/tests/core/unread-state.spec.ts:52`
