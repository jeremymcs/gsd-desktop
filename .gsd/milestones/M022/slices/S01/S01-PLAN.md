# S01: Update Parked Idea Text

**Goal:** Add safe editing for parked idea text.

## Tasks

- [x] Add an append-only parked idea update event.
- [x] Replay updated text while preserving created source metadata.
- [x] Add desktop IPC/store/UI edit wiring.
- [x] Validate non-empty edited text.
- [x] Cover replay and Electron restart behavior.

## Acceptance

- A parked idea exposes an edit action.
- Saving revised text updates the idea pool immediately.
- Restart restores the revised parked idea text.
- Source prompt and current review status are unchanged by the edit.
