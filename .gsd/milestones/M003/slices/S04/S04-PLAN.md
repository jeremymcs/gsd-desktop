# S04: Approved Injection - Plan

## Goal

Let a reviewed draft change proposal become an approved, append-only injection into the active plan without mutating prior accepted plan output.

## Acceptance

- Only draft change proposals can be approved.
- Approval requires an accepted PLAN output.
- Approval records a durable `change.proposal-approved` event.
- The source proposal is marked approved and keeps its source parked-item link.
- The injected task records target milestone, target slice, dependencies, accepted output, and task path.
- Existing milestone, slice, and task IDs remain unchanged.
- Approval creates a new accepted roadmap output instead of editing an old output in place.
- Generated Markdown projections are regenerated from database state.
- EXECUTE, VERIFY, and SHIP use the latest accepted roadmap output.
- Approved proposal state survives app restart.

## Notes

This slice implements additive task injection. S05 will add removal and hidden-state semantics with the same append-only constraint.
