# T01: Planning Store Bridge

## Goal

Expose root-workspace planning database state to the desktop renderer through narrow typed IPC.

## Scope

- Add desktop planning state keyed by workspace.
- Load, create, select, answer, revise, and confirm plans through main-process methods.
- Keep SQLite access in the main process only.
- Use optimistic revision checks from the planning engine.

## Verification

- Typecheck catches IPC/state contract drift.
- Electron spec proves renderer actions persist through the main-process bridge.
