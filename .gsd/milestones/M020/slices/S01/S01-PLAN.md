# S01: Update Draft Proposal Details

**Goal:** Add safe detail editing to the draft change proposal lifecycle.

## Tasks

- [x] Add `change.proposal-updated` event and replay handling.
- [x] Add desktop state, IPC, preload, main, and app-store update wiring.
- [x] Validate that only draft proposals can be updated.
- [x] Show `Edit draft details` for draft proposals.
- [x] Hide competing mutation forms while draft details are being edited.
- [x] Cover replay and Electron restart behavior.

## Acceptance

- A draft proposal can be edited before approval.
- Blank title, summary, and impact updates are rejected.
- Updated proposal details are visible immediately.
- Updated proposal details remain visible after restart.
