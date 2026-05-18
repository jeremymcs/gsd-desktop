# M034: Overnight Run Handoff And Recovery

Long autonomous runs need a durable recovery story: what was attempted, what passed, where execution stopped, and how the next session should resume without rereading the entire plan.

## Success Criteria

- Handoff state summarizes last attempted task and stop reason.
- Recovery starts from the next safe item.
- `.gsd/NEXT.md` and UI agree after restart.

