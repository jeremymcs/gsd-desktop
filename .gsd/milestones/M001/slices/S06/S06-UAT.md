# S06 UAT: PLAN Proposal, Editing, and Validation

## Scenario

1. Open a workspace in the desktop app.
2. Open Plans.
3. Create a plan.
4. Complete and confirm DISCUSS.
5. Stage and accept RESEARCH.
6. Click **Start plan**.
7. Edit milestone, phase, slice, task, dependency, boundary map, and idea pool fields.
8. Add an invalid task dependency.
9. Stage the plan and observe the blocked validation state.
10. Remove the invalid dependency.
11. Stage and accept the valid plan.
12. Restart the app and reopen Plans.

## Expected Result

- PLAN can only start after accepted RESEARCH exists.
- Invalid dependency output remains blocked and cannot be accepted.
- Valid PLAN output can be accepted.
- After restart, the accepted PLAN output is restored from `.gsd/gsd.db`.
