# S05: SHIP Gate

**Goal:** Let users advance from passed VERIFY checks into SHIP and save a durable handoff summary for release readiness.

## Tasks

- [x] **T01: Ship summary event model**
  Add append-only ship summary records to the planning database replay model.

- [x] **T02: SHIP transition guard**
  Block SHIP until VERIFY is active and every accepted task has passed verification.

- [x] **T03: Desktop action bridge**
  Wire narrow renderer, preload, IPC, and Electron store actions for starting SHIP and saving the handoff summary.

- [x] **T04: Ship gate UI**
  Show verified tasks, evidence, verification notes, a deterministic handoff draft, and saved summary state in Plan Builder.

- [x] **T05: Restart coverage**
  Extend the Plan Builder Electron spec to enter SHIP, save a summary, and prove it survives restart.

## Acceptance

- SHIP cannot start before VERIFY is active.
- SHIP cannot start unless every accepted task has passed verification.
- Ship summaries can only be recorded during SHIP.
- Ship summaries are persisted as database events.
- Restart preserves SHIP phase and the saved handoff summary.
