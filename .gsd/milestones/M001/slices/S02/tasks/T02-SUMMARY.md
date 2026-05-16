---
milestone: M001
slice: S02
task: T02
status: done
---

# T02 Summary: Safe projection writer

Added safe filesystem writes for generated GSD projections.

## Built

- `writeProjectionFiles` writes generated files under the workspace root.
- `regenerateProjections` exposes the manual repair/debug regeneration path.
- Existing generated files with identical content are skipped.
- Existing files without the generated ownership header are blocked by default.
- Explicit `allowLegacyOverwrite` can replace legacy files when the caller has user approval.
- Writes use temp-file-and-rename behavior.
- `ProjectionWriteConflictError` reports blocked legacy paths.

## Verification

- Package tests cover first write, unchanged regeneration, legacy conflict, and explicit overwrite.
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm typecheck`

## Follow-Up

- S03/S04 should surface conflict results clearly in UI rather than silently overwriting user-authored `.gsd` files.

