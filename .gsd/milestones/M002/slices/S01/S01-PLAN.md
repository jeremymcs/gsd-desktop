# S01: EXECUTE Queue Activation

**Goal:** Let users explicitly move an accepted plan into `EXECUTE` and see the accepted milestones, slices, and tasks as a restart-safe queue.

## Tasks

- [x] **T01: Lifecycle phase event**
  Add a persisted event for moving a plan to a new lifecycle phase without inventing execution task state yet.

- [x] **T02: Start execute bridge**
  Wire a narrow desktop action from renderer through preload, IPC, and Electron store.

- [x] **T03: Execution queue UI**
  Render a compact queue from the accepted plan proposal and keep the workbench visual model.

- [x] **T04: Restart coverage**
  Extend the Plan Builder Electron spec to start execution and assert the execution view after restart.

## Acceptance

- `EXECUTE` cannot start before an accepted, valid PLAN exists.
- Starting `EXECUTE` persists `activePhase: "execute"` and `activeStage: "task"`.
- The queue displays accepted milestone, slice, and task data.
- Restart returns to the execution queue.
