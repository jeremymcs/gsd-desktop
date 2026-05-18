# S01: Restore Approved Injected Task

**Goal:** Let users restore an approved injected task that was hidden from the active PLAN.

## Tasks

- [x] Add `plan.item-restored` to planning events and replay.
- [x] Add desktop restore input, IPC, preload, and app-store handlers.
- [x] Rebuild the accepted PLAN from the original approved injection record.
- [x] Show `Restore injected task` when an approved injected proposal is hidden.
- [x] Cover replay and Electron restart behavior.

## Acceptance

- Hidden injected tasks show a restore action.
- Restoring removes the hidden marker and writes a new accepted PLAN output.
- Restored tasks are projected back into `.gsd` files.
- The task can be hidden again with a fresh reason.
