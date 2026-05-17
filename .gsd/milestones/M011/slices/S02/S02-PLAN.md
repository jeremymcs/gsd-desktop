# S02: Composer PLAN Handoff

**Goal:** Let the bottom Plan Builder composer start PLAN after research is accepted.

## Tasks

- [x] Extend composer phase actions to accepted-research state.
- [x] Route composer action through the existing `startPlan` handler.
- [x] Keep the composer accessible name distinct from the card button.
- [x] Add Electron coverage for composer-driven PLAN handoff.

## Acceptance

- After accepted research, the composer arrow is enabled.
- Clicking the composer arrow opens the PLAN proposal editor.
- Persisted planning state moves to active phase `plan` and stage `roadmap`.
