# S02: Restore Dismissed Ideas

**Goal:** Make dismissed parked ideas reversible.

## Tasks

- [x] Add a restore action for dismissed parked ideas.
- [x] Reuse append-only review/status events where possible.
- [x] Show restore only when the idea is dismissed.
- [x] Cover restored status after restart.

## Acceptance

- A dismissed idea can return to parked status.
- Restored ideas can be kept, prepared, or dismissed again.
- Dismiss and restore history is preserved in the event stream.
