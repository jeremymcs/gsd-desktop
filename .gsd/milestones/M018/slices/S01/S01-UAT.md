# S01 UAT: Restore Hidden Injected Task

A user approves an injected task, hides it from the active plan, restores it from the proposal card, then hides it again.

## Expected

- The hidden task note appears after the first hide.
- `Restore injected task` becomes available while the task is hidden.
- Restoring removes the hidden note and recreates the task projection.
- Hiding again removes the task projection and persists the new hidden state across restart.
