# S02 Plan: Requirements Contract Review

## Goal

Turn REQUIREMENTS answers into explicit database-backed requirement records before PLAN.

## Scope

- Derive stable requirement drafts from the four requirements-stage answers.
- Save those drafts through a dedicated planning IPC path as `requirement.upserted` events.
- Show a requirements contract panel in the Plan Builder side pane with class, status, owner, source, and validation state.
- Cover saved requirements in the Electron Plan Builder flow and generated `.gsd/REQUIREMENTS.md`.

## Acceptance

- The requirements depth gate exposes a reviewable contract before the user confirms REQUIREMENTS.
- Saving the contract persists four `R001`-style requirement rows into the planning database.
- Restarted Plan Builder sessions show the saved requirements contract.
- Generated `.gsd/REQUIREMENTS.md` contains the saved requirement rows and traceability summary.
