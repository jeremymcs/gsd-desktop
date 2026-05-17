# S05 Summary

Discussion memory cards now include the original question that produced each saved answer.

## Changes

- Rendered `answer.prompt` on each Discussion memory card in `PlanBuilderView`.
- Added focused styling for the question line so it reads as context above the saved answer or revision editor.
- Extended the Plan Builder Electron spec to assert the question appears before revision, after revision, and after restart.

## Notes

The prompt text was already persisted with each answer, so this is a UI projection change only.
