# M020: Edit Draft Change Proposals

## Vision

Change-control should let users correct a draft before approval. A typo, weak summary, or unclear impact note should not force the user to delete and recreate the proposal, while approved history remains immutable.

## Success Criteria

- Draft change proposal title, summary, and impact notes can be edited from the proposal card.
- Edits are represented as append-only proposal update events.
- Only draft proposals can be edited.
- Updated draft details survive SQLite replay and Electron restart.
- Approved, deleted, injected, and modified proposal semantics remain unchanged.

## Non-Goals

- Editing approved proposals.
- Editing deleted proposal history.
- Mutating existing `.gsd/gsd.db` rows in place.
- Changing plan task injection, modification, hide, or restore semantics.
