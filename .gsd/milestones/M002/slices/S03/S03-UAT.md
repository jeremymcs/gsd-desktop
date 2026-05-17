# S03: Task Status and Evidence Capture - UAT

## Scenario

A user reaches EXECUTE, links a task session, records a blocker, marks the task done with evidence, and restarts the desktop app.

## Result

Passed.

Evidence:

- The task status changes to `Blocked` with a visible blocker.
- The task status changes to `Done` only after evidence is supplied.
- The task evidence list shows `Linked session created and reopened from EXECUTE.`
- Restarted Plan Builder still shows the completed task and evidence.

The targeted Plan Builder Electron spec passed with 2 tests. The full `core` lane still has unrelated failures outside Plan Builder.
