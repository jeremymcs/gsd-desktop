# S02: Task Session Linking - UAT

## Scenario

A user reaches EXECUTE, creates a linked session from the first task, opens the linked session, returns to Plans, and restarts the desktop app.

## Result

Passed.

Evidence:

- The task row shows `Linked session: Task T1 - Implement and verify the slice`.
- Opening the task link selects the linked normal session.
- Restarted Plan Builder still shows the linked task session.
- Desktop state includes a non-empty `taskSessionLinks` entry for `T1`.
