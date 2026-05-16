# S02 Summary: Projection Generator and Adoption Safety

S02 added generated Markdown projection support to the shared planning package.

## What Shipped

- Pure projection renderers for GSD planning-phase artifacts.
- Generated ownership headers that identify `.gsd/gsd.db` as canonical.
- Projection paths for project, requirements, state, decisions, milestone, slice, and task files.
- Safe writer with changed-file skipping and atomic writes.
- Legacy Markdown conflict detection with explicit overwrite support.
- Manual regeneration API.
- Package tests for render output and writer safety.

## Verification

- `pnpm --filter @pi-gui/gsd-planning test` passed.
- `pnpm typecheck` passed.

## Downstream Notes

- UI/IPC should call `regenerateProjections` for manual repair.
- Projection conflicts should be shown to the user as adoption/overwrite choices.
- S06 should feed approved hierarchy records into the projection types.

