# S04 UAT: Persisted DISCUSS Wizard

## Acceptance Checks

- Open a workspace in the desktop app.
- Click `Plans` in the sidebar.
- Create a named plan.
- Answer all Project questions and confirm the Project depth gate.
- Answer all Requirements questions and confirm the Requirements depth gate.
- Answer all Milestone questions and confirm the Milestone depth gate.
- Edit a saved answer from the discussion memory panel.
- Close and reopen the app for the same workspace.
- Open `Plans` and confirm the plan, completed DISCUSS state, and revised answer are restored.

## Automated Proof

`apps/desktop/tests/core/plan-builder.spec.ts` covers plan creation, all DISCUSS depth gates, answer revision, `.gsd/gsd.db` creation, and restart persistence on the Electron surface.

## Remaining Risk

Research, structured PLAN hierarchy generation, Markdown projection from accepted UI state, and structural add/delete operations are still later slices.
