# S01: Primary Queue Start Action

**Goal:** Add a single primary action for the first ready next-work item.

## Tasks

- [x] Add a queue header action that targets the first ready item.
- [x] Open an existing linked task session when the first ready item already has one.
- [x] Create and open a task session when the first ready item has no link.
- [x] Cover ordering, linked/unlinked behavior, and restart stability in Electron.

## Acceptance

- The button label names the first ready task path.
- Blocked queues do not allow a start action.
- The first ready item after restart is the same item the panel displays first.
