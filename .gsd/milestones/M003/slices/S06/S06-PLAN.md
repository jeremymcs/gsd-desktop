# S06: Approved Modification - Plan

## Goal

Let users approve a draft change proposal as a modification to an existing active task while preserving task identity and prior accepted roadmap history.

## Acceptance

- Only draft change proposals can become approved task modifications.
- Modification requires an accepted PLAN output.
- The user chooses an existing active task path.
- Task ID and task path remain stable.
- Task title, acceptance, and dependencies can change.
- Approval records a durable `change.proposal-modification-approved` event.
- Modification creates a new accepted roadmap output instead of editing old output in place.
- Prior accepted outputs remain available for audit.
- Generated Markdown projections use the latest accepted roadmap output.
- VERIFY and SHIP treat stale task verification as stale when acceptance changes.
- Approved modification state survives app restart.

## Notes

This slice implements task-level modification only. Milestone and slice edits remain out of scope until the task-level workflow is proven.
