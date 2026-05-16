# S01 UAT: Planning Engine Foundation

This is developer-facing UAT for the package foundation.

## Checks

- Run `pnpm --filter @pi-gui/gsd-planning test`.
- Run `pnpm typecheck`.
- Confirm a temporary workspace test creates `.gsd/gsd.db` and `.gitignore` includes `.gsd/gsd.db`.
- Confirm stale writes throw `PlanningRevisionConflictError`.

## Expected Result

All checks pass. No desktop UI is expected in S01.

