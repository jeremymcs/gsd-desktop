# S03: Draft Change Proposal - Plan

## Goal

Let a promotion-ready parked idea seed a draft change proposal with explicit impact notes before it can alter the accepted plan.

## Acceptance

- Draft change proposals are canonical database records.
- A proposal references the source parked item.
- Only `promotion-ready` parked items can draft a proposal.
- The draft captures title, summary, and impact notes.
- Draft proposals are visible in the Plan Builder outline.
- Draft proposals do not mutate accepted milestones, slices, tasks, projections, or execution state.
- Draft proposals survive app restart.

## Notes

S04 will add the approval gate that turns a draft proposal into append-only plan structure changes.
