# S05: Removal and Hidden State - Plan

## Goal

Let users remove approved plan additions from the active plan through append-only hidden-state events, while preserving prior accepted outputs and audit history.

## Acceptance

- Hiding a task requires an active accepted plan output.
- Hiding records a durable `plan.item-hidden` event.
- Hidden items keep target type, target ID, target path, reason, accepted output, and creation time.
- The prior accepted output that introduced the task remains unchanged.
- Hiding creates a new accepted roadmap output without the hidden task.
- Active generated projections omit hidden tasks.
- Stale generated projection files for hidden tasks are removed.
- Hand-written or legacy Markdown files are not removed.
- EXECUTE, VERIFY, and SHIP use the latest accepted roadmap output.
- Hidden-state UI survives app restart.

## Notes

This slice implements task-level hidden state for approved injected tasks. It deliberately avoids destructive edits to prior plan output and does not generalize removal to milestones or slices yet.
