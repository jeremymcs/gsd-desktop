# M026: Next Work Queue

## Vision

Plan Builder should be able to tell a user or agent what to do next without re-reading every milestone file. The next work queue should derive from the database-backed plan, accepted tasks, dependencies, status, and verification state.

## Success Criteria

- The UI shows the next unblocked work items for the active plan.
- Queue ordering respects task dependencies and current execution status.
- Blocked, done, verified, and shipped items are not suggested as next work.
- A generated handoff projection summarizes the next actionable items.
- Electron coverage proves queue state survives restart.

## Non-Goals

- Running tasks automatically.
- Creating commits or modifying git history from the UI.
- Replacing detailed milestone and slice files.
- Scheduling calendar or background automation.
