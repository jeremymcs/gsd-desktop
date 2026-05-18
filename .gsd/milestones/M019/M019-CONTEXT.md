# M019: Delete Draft Change Proposals

## Vision

Change-control should let users back out of a bad draft before approval. The database should still preserve what happened, but the active workflow should no longer strand the parked idea behind a draft that cannot be replaced.

## Success Criteria

- Draft change proposals can be deleted from the proposal card.
- Deletion is represented as an append-only withdrawal event.
- Deleted drafts stay visible as history with a deleted status.
- The source parked idea can create a replacement draft after deletion.
- Replay and Electron coverage prove the state survives restart.

## Non-Goals

- Deleting approved proposals.
- Removing historical rows from `.gsd/gsd.db`.
- Changing approved injection, modification, hide, or restore semantics.
