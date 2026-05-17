# S02: Phase Editor and Assignment UI

**Goal:** Let users manage phases directly in the PLAN editor and assign milestones to known phases.

## Tasks

- [x] Add phase add/edit/delete handlers in Plan Builder.
- [x] Render a phase editor in the PLAN proposal form.
- [x] Replace milestone phase free text with a phase select.
- [x] Keep deletion safe by preserving at least one phase and reassigning affected milestones.
- [x] Extend Electron coverage for editing, adding, assigning, and deleting phase rows.

## Acceptance

- PLAN shows editable phase rows.
- Users can add a second phase and assign a milestone to it.
- Deleting a phase does not leave milestones pointing at a missing phase.
- The PLAN editor still validates and stages a plan.
