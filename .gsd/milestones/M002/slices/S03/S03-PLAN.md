# S03: Task Status and Evidence Capture

**Goal:** Let EXECUTE tasks persist progress, blockers, notes, and evidence as planning database events.

## Tasks

- [x] **T01: Task execution events**
  Add append-only events for latest task status and recorded evidence.

- [x] **T02: Replay model**
  Replay task execution state into plan snapshots without treating generated Markdown as source.

- [x] **T03: Desktop update bridge**
  Wire a narrow action from renderer through preload, IPC, and the Electron store.

- [x] **T04: Queue controls**
  Show task status, blockers, notes, evidence, and compact controls in the EXECUTE queue.

- [x] **T05: Restart coverage**
  Extend the Plan Builder Electron spec to save blocker/evidence state and verify it after restart.

## Acceptance

- Only accepted PLAN tasks can receive execution state.
- Task state cannot be updated before EXECUTE is active.
- Blocked tasks require a blocker.
- Done tasks require evidence.
- Restart preserves status, notes, blockers, and evidence.
