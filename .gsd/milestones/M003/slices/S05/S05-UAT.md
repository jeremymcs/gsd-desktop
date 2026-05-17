# S05: Removal and Hidden State - UAT

## Scenario

A user parks a note, marks it ready to promote, drafts a change proposal, accepts an initial plan, approves the proposal into the accepted plan as a new task, hides that injected task with a reason, executes the active plan, verifies it, ships it, and restarts the app.

## Result

Passed.

Evidence:

- Approved injected tasks show a hide form after they are added to the active plan.
- Hiding a task requires a reason.
- The approved proposal remains visible and changes to a hidden-state note.
- A new accepted roadmap output is created for the hidden-task change.
- The historical accepted output that included the injected task remains available.
- The latest accepted output omits the hidden task.
- Generated slice projections omit the hidden task.
- The stale generated task projection is removed from disk.
- EXECUTE, VERIFY, and SHIP use only the latest active plan.
- Restarted Plan Builder still shows the approved proposal, hidden-state note, hidden item state, and shipped active plan.

The targeted Plan Builder Electron spec passed with 2 tests.

The full Electron core lane also ran. Both Plan Builder specs passed in that lane, and the lane finished with 61 passed and 5 failures outside the Plan Builder surface:

- `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
- `apps/desktop/tests/core/provider-settings.spec.ts:13`
- `apps/desktop/tests/core/unread-state.spec.ts:52`
