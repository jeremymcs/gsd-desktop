# T02: PLAN Store Bridge

## Goal

Expose PLAN proposal events to the desktop renderer through narrow typed IPC.

## Scope

- Add typed inputs for starting PLAN, proposing PLAN output, and reviewing PLAN output.
- Keep SQLite access in the main process.
- Require accepted RESEARCH before PLAN writes.
- Persist proposed PLAN output with `generated-output.proposed` using stage `roadmap`.
- Persist accept/reject decisions with `generated-output.reviewed`.
- Enforce the validator before accepting a PLAN proposal.

## Verification

- Typecheck catches IPC/state contract drift.
- Electron spec proves renderer actions persist through the main-process bridge.
