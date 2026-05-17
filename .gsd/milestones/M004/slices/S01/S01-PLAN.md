# S01: Workflow Preferences Bootstrap - Plan

## Goal

Capture the recommended workflow defaults as durable Plan Builder state and project them into the files used by the GSD workflow.

## Acceptance

- Plan Builder can append a `workflow.preferences-updated` event.
- The event records `commit_policy: per-task`.
- The event records `branch_model: single`.
- The event records `uat_dispatch: true`.
- The event records `research: skip`.
- The event records `models.executor_class: balanced`.
- The event replays into `PlanSnapshot.workflowPreferences`.
- The UI shows a workflow preferences card before preferences are saved.
- The user can apply the recommended defaults from the UI.
- The UI shows a saved state after preferences are captured.
- `.gsd/PREFERENCES.md` is generated from the database.
- `.gsd/runtime/research-decision.json` is generated from the database.
- Captured preferences survive app restart.

## Notes

This slice intentionally captures deterministic defaults only. Later slices can add change-control for editing preferences after the bootstrap path is proven.
