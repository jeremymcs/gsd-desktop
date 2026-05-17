# S01: Phase Draft Model and Validation

**Goal:** Represent phases as top-level PLAN proposal records while keeping older accepted PLAN JSON readable.

## Tasks

- [x] Add a `PlanningPhaseDraft` type and `phases` collection to PLAN proposal drafts.
- [x] Seed generated PLAN drafts with a default phase.
- [x] Parse older proposal JSON by deriving phases from milestone phase references.
- [x] Validate phase IDs, titles, goals, duplicates, and milestone phase references.

## Acceptance

- Existing accepted PLAN JSON without `phases` still parses.
- New PLAN drafts include a phase row.
- Validation blocks milestones that reference an unknown phase.
- Desktop typecheck passes.
