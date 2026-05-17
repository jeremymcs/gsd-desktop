# S04: Approved Injection - UAT

## Scenario

A user parks a note, marks it ready to promote, drafts a change proposal, accepts an initial plan, approves the proposal into the accepted plan as a new task, executes both tasks, verifies both tasks, ships the plan, and restarts the app.

## Result

Passed.

Evidence:

- Draft change proposals show an approval form after a plan is accepted.
- Approval targets an existing milestone/slice and creates a new task.
- The proposal status changes to Approved and displays the injected task path.
- The accepted plan list includes a new accepted output for the approved change.
- Generated slice and task projections include the injected task.
- EXECUTE uses the latest accepted plan and shows both the original task and injected task.
- VERIFY and SHIP require and show both tasks.
- Restarted Plan Builder still shows the approved proposal, injected task evidence, verification notes, and ship summary.

The targeted Plan Builder Electron spec passed with 2 tests.

The full Electron core lane also ran. Both Plan Builder specs passed in that lane, and the lane finished with 61 passed and 5 failures outside the Plan Builder surface:

- `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
- `apps/desktop/tests/core/provider-settings.spec.ts:13`
- `apps/desktop/tests/core/unread-state.spec.ts:52`
