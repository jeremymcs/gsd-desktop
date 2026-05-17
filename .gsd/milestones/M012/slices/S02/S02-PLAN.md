# S02: Composer SHIP Handoff

**Goal:** Let the Plan Builder composer start SHIP only after every active task verification passes.

## Tasks

- [ ] Derive top-level SHIP readiness from accepted plan tasks and current verification records.
- [ ] Add a composer phase action that calls the existing `startShip` handler when ready.
- [ ] Keep the composer disabled/status-only while verification is incomplete or failed.
- [ ] Add Electron coverage for the composer SHIP handoff.

## Acceptance

- The composer does not expose a SHIP handoff before all task verifications pass.
- After all task verifications pass, the composer advances to SHIP.
- Persisted planning state reports `activePhase: "ship"` and `activeStage: "ship"`.
