# S01: Composer Parked-Idea Review Handoff

**Goal:** Let users review the newest composer-parked idea from the composer surface.

## Tasks

- [x] Track the most recently parked composer idea in Plan Builder UI state.
- [x] Render a compact composer follow-up with Keep, Prepare, and Dismiss actions.
- [x] Route follow-up actions through the existing idea review handler.
- [x] Add Electron coverage for immediate review and persistence after restart.

## Acceptance

- Parking a later-phase composer note shows a review follow-up for that note.
- Clicking Prepare updates the idea pool status to `Ready to promote`.
- The active workflow phase does not change.
- Restart preserves the reviewed status.
