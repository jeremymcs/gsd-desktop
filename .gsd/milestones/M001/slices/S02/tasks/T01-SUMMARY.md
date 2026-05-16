---
milestone: M001
slice: S02
task: T01
status: done
---

# T01 Summary: Projection types and renderers

Added pure projection rendering to `@pi-gui/gsd-planning`.

## Built

- Projection types for generated files, decisions, state, milestones, slices, tasks, and boundary maps.
- `generatePlanningProjections` to render planning-phase GSD files.
- Generated ownership headers with source DB, plan ID, readable plan ID, revision, timestamp, and do-not-edit metadata.
- Renderers for project, requirements, state, decisions, milestone context, milestone research, milestone roadmap, slice context, slice plan, and task plan files.
- Public exports from the package index.

## Verification

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm typecheck`

## Follow-Up

- S06 should supply richer hierarchy data to these projection types instead of introducing a second rendering path.

