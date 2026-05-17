# S01: Direct Park-Idea Action - Summary

S01 adds the database-backed action needed for later-phase composer idea capture.

Implemented:

- Extended parked item source metadata to allow composer-origin notes.
- Added `parkPlanningIdea` through desktop state, IPC, preload, and app-store planning wiring.
- Implemented the action as a direct `idea.parked` append, without `answer.recorded`.
- Added planning-store coverage proving composer-origin ideas do not create answers or move active phase/stage.

Verification:

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
