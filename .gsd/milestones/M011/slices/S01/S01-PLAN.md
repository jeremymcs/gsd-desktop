# S01: Composer RESEARCH Handoff

**Goal:** Let the bottom Plan Builder composer start RESEARCH after DISCUSS is confirmed.

## Tasks

- [x] Add a non-question composer phase action for DISCUSS-complete state.
- [x] Keep unresolved-guidance acknowledgement requirements intact.
- [x] Route composer action through the existing `startResearch` handler.
- [x] Keep the composer action accessible name distinct from the card button.
- [x] Add Electron coverage for composer-driven RESEARCH handoff.

## Acceptance

- After DISCUSS gates are confirmed, the composer arrow is enabled when research can start.
- Clicking the composer arrow opens the RESEARCH panel.
- Persisted planning state moves to `research`.
