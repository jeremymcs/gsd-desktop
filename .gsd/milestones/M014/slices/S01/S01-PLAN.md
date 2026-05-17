# S01: Direct Park-Idea Action

**Goal:** Add a narrow desktop planning action that parks an idea directly without recording an answer.

## Tasks

- [x] Extend parked item source metadata to allow composer-origin notes.
- [x] Add desktop state, preload, IPC, and app-store wiring for `parkPlanningIdea`.
- [x] Append only an `idea.parked` event, preserving the current active phase and stage.
- [x] Add focused package or Electron coverage for no synthetic answer record.

## Acceptance

- Directly parked ideas appear in `PlanSnapshot.parkedItems`.
- Directly parked ideas do not increase answer count.
- Active phase and stage remain unchanged.
