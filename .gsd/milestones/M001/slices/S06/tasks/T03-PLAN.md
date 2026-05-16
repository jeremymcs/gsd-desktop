# T03: PLAN Editor UI

## Goal

Extend Plan Builder so users can structurally edit a proposed execution plan.

## Scope

- Add a PLAN state after accepted RESEARCH.
- Show editable boundary map and idea pool fields.
- Show editable milestones, phases, slices, tasks, and dependencies.
- Support add/delete controls for milestones, slices, and tasks.
- Show validation errors in the editor and on staged draft outputs.
- Show pending, accepted, and rejected plan output history.

## Verification

- Electron coverage drives the visible controls.
- Restart coverage proves accepted PLAN output is restored from database state.
