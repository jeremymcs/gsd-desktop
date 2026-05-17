# S06: Approved Modification - UAT

## Scenario

A user parks a change idea, prepares it for promotion, drafts a change proposal, accepts the initial plan, approves the proposal as a modification to task `M1/S1/T1`, then continues through injection, removal, EXECUTE, VERIFY, SHIP, and restart.

## Result

Passed.

Evidence:

- Draft change proposals show a task modification form after a plan is accepted.
- The user can select an existing task path and update acceptance.
- Approval marks the proposal Approved and displays `Modified M1/S1/T1`.
- A new accepted roadmap output is created for the modification.
- Generated task projections include the modified acceptance.
- EXECUTE, VERIFY, and SHIP use the latest accepted task details.
- Restarted Plan Builder still shows the approved modification and persisted modification record.

The targeted Plan Builder Electron spec passed with 2 tests.

The full Electron core lane also ran. Both Plan Builder specs passed in that lane, and the lane finished with 60 passed and 6 failures outside the Plan Builder surface:

- `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
- `apps/desktop/tests/core/new-thread-auto-title.spec.ts:194`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
- `apps/desktop/tests/core/provider-settings.spec.ts:13`
- `apps/desktop/tests/core/unread-state.spec.ts:52`
