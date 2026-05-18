# M018: Restore Hidden Injected Tasks

## Vision

Users can already hide an injected task when a change proposal no longer belongs in the active plan. That action should be reversible without editing generated Markdown by hand or losing the append-only planning history.

## Success Criteria

- Hidden approved injected tasks can be restored from the change proposal card.
- Restore is recorded as a first-class plan event.
- Restored tasks regenerate the accepted PLAN projection from database state.
- The same task can be hidden again after restore.
- Replay and Electron coverage prove the state survives restart.

## Non-Goals

- Restoring arbitrary deleted tasks.
- Editing the original approved injection record.
- Introducing a general undo stack.
