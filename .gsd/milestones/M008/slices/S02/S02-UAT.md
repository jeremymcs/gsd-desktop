# S02: Phase Editor and Assignment UI - UAT

## Scenario

A user reaches PLAN, edits the default phase, adds another phase, assigns the first milestone to the new phase, and deletes the unused original phase.

## Checks

- The PLAN editor shows at least one phase row.
- The last remaining phase cannot be deleted.
- Adding a phase creates a new selectable phase ID.
- Milestone phase assignment uses a select instead of free text.
- Deleting a phase does not leave the milestone with an unknown phase.
