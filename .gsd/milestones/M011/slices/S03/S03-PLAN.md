# S03: Composer EXECUTE Handoff

**Goal:** Let the bottom Plan Builder composer start EXECUTE after a valid plan is accepted.

## Tasks

- [x] Extend composer phase actions to accepted-plan state.
- [x] Route composer action through the existing `startExecution` handler.
- [x] Keep the composer accessible name distinct from the card button.
- [x] Add Electron coverage for composer-driven EXECUTE handoff.

## Acceptance

- After accepting a valid plan, the composer arrow is enabled.
- Clicking the composer arrow opens the EXECUTE queue.
- Persisted planning state moves to active phase `execute` and stage `task`.
