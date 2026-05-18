# M036: Autonomous Run Activity Ledger

Autonomous work needs an audit trail beyond latest recovery state. Users should see what the run attempted, what passed, and why it stopped.

## Success Criteria

- Run activity is append-only and persisted.
- UI shows recent run activity beside the execution queue.
- `.gsd/NEXT.md` includes a compact run activity ledger.
