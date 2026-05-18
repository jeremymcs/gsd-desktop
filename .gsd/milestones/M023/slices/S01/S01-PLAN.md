# S01: Proposal Activity Projection

**Goal:** Expose proposal lifecycle activity in planning snapshots.

## Tasks

- [ ] Add proposal activity records to the planning domain model.
- [ ] Replay activity from existing proposal, task modification, hide, and restore events.
- [ ] Keep activity derived from events, not separately mutable.
- [ ] Add package replay coverage.

## Acceptance

- Each proposal can list its lifecycle entries.
- Activity order matches event order.
- Existing proposal status and action behavior does not change.
