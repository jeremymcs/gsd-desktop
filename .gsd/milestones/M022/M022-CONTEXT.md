# M022: Edit Parked Ideas

## Vision

Parked ideas are useful because they let users keep motion without forcing every thought into the active plan. Users also need to correct, restore, or refine those parked notes before promoting them into change proposals.

## Success Criteria

- Parked idea text can be edited through append-only events.
- Dismissed ideas can be restored without deleting history.
- Updated parked ideas preserve source prompt and review status.
- Drafting a change proposal uses the latest parked idea text.
- Replay and Electron restart coverage prove edits and restores survive.

## Non-Goals

- Editing approved change proposal history.
- Merging multiple parked ideas into one proposal.
- Deleting events from `.gsd/gsd.db`.
- Auto-promoting parked ideas without user review.
