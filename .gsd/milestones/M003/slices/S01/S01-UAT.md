# S01: First-Class Idea Pool - UAT

## Scenario

A user starts a new plan, parks a note on the first DISCUSS question, then answers the same question with load-bearing context and continues through the workflow.

## Result

Passed.

Evidence:

- The active question remains `What should we call this project?` after clicking `Park`.
- The answer textarea clears so the user can enter the load-bearing answer.
- The parked note appears in the outline idea pool.
- Restarted Plan Builder still shows the parked note in the idea pool.
- App state includes the parked item in `selectedPlan.parkedItems`.

The targeted Plan Builder Electron spec passed with 2 tests.

The full Electron core lane also ran. Both Plan Builder specs passed in that lane, and the lane finished with 61 passed and 5 failures outside the Plan Builder surface:

- `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
- `apps/desktop/tests/core/provider-settings.spec.ts:13`
- `apps/desktop/tests/core/unread-state.spec.ts:52`
