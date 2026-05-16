# T01: Research Store Bridge

## Goal

Expose research-stage planning events to the desktop renderer through narrow typed IPC.

## Scope

- Add typed inputs for starting research, proposing findings, and reviewing staged output.
- Keep SQLite access in the main process.
- Persist proposed research with `generated-output.proposed`.
- Persist accept/reject decisions with `generated-output.reviewed`.
- Use optimistic revision checks for every committed write.

## Verification

- Typecheck catches IPC/state contract drift.
- Electron spec proves renderer actions persist through the main-process bridge.
