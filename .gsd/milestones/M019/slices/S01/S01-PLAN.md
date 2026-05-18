# S01: Withdraw Draft Proposal

**Goal:** Add safe draft deletion to the change proposal lifecycle.

## Tasks

- [x] Add `withdrawn` to change proposal status.
- [x] Add `change.proposal-withdrawn` event and replay handling.
- [x] Add desktop state, IPC, preload, main, and app-store withdrawal wiring.
- [x] Show `Delete draft` for draft proposals.
- [x] Let a withdrawn draft stop blocking a replacement draft for the same parked idea.
- [x] Cover replay and Electron restart behavior.

## Acceptance

- A draft proposal can be deleted before approval.
- Deleted draft history remains visible as `Deleted`.
- The source parked idea shows `Draft change` again.
- A replacement draft persists across restart.
