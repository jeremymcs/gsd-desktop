# S02: Idea Review Actions - Plan

## Goal

Let users review parked ideas without changing the active plan. Each parked idea can be kept, dismissed, or prepared for promotion, and that decision persists as database state.

## Acceptance

- Parked idea review choices are stored as append-only planning events.
- `PlanSnapshot.parkedItems` exposes the current review status for each parked idea.
- The Plan Builder idea pool shows the current status and actions for each parked idea.
- Keep, Dismiss, and Prepare do not mutate accepted milestones, slices, tasks, or generated projections.
- Review status survives app restart.

## Notes

S03 will use `promotion-ready` parked ideas to seed a draft change proposal with impact notes. S02 only records intent.
