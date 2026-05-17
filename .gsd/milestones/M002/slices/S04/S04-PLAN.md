# S04: VERIFY Gate

**Goal:** Let users start VERIFY only after accepted PLAN tasks are done with evidence, then record explicit pass/fail checks against each task's acceptance criteria.

## Tasks

- [x] **T01: Verification event model**
  Add append-only task verification records to the planning database replay model.

- [x] **T02: VERIFY transition guard**
  Block VERIFY until EXECUTE is active and every accepted task is done with evidence.

- [x] **T03: Desktop action bridge**
  Wire narrow renderer, preload, IPC, and Electron store actions for starting VERIFY and saving task verification.

- [x] **T04: Verify gate UI**
  Show accepted task acceptance, execution evidence, verification result, and note controls in the Plan Builder.

- [x] **T05: Restart coverage**
  Extend the Plan Builder Electron spec to pass a task verification and prove it survives restart.

## Acceptance

- VERIFY cannot start before EXECUTE is active.
- VERIFY cannot start while accepted tasks are missing done status or evidence.
- Task verification can only be recorded during VERIFY.
- Failed verification requires a note.
- Restart preserves VERIFY phase and task verification results.
- SHIP is not advanced by this slice.
