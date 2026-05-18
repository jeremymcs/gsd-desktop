# M027: Start Next Work From Queue

Plan Builder can already compute and display next work. The next step is to make the queue actionable as the primary overnight driver: one obvious action should start or open the first ready task without asking the user to scan individual task rows.

## Success Criteria

- The first ready queue item has a deterministic primary action.
- Existing linked task sessions open directly.
- Unlinked ready tasks create the task session and open it.
- Blocked or empty queues do not expose a misleading start action.

