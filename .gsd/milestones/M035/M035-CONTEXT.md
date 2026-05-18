# M035: Resume From Recovery Target

Run recovery now records where an overnight run stopped and the safest next target. The next step is to make that handoff actionable from the UI so a user can resume without re-scanning the queue.

## Success Criteria

- The recovery summary exposes a resume/open action when a resume target exists.
- The action follows the same task-session behavior as the next-work queue.
- Restart preserves the recovery target and the action still works.
