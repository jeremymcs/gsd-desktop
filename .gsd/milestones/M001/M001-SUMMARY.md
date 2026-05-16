# M001 Summary: Database-Backed Plan Builder

## Completed Slices

### S01: Planning Engine Foundation

The shared planning engine package now exists and provides the database foundation for the Plan Builder. It can create/open `.gsd/gsd.db`, create named plans, append typed events, replay snapshots, store requirement records, update `.gitignore`, and reject stale writes with optimistic revision checks.

Verification:
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm typecheck`

### S02: Projection Generator and Adoption Safety

The planning package now renders and safely writes planning-phase GSD Markdown projections. It produces `PROJECT.md`, `REQUIREMENTS.md`, `STATE.md`, `DECISIONS.md`, milestone context/research/roadmap files, slice context/plan files, and task plan files from typed projection input. Files include generated ownership headers, skip unchanged rewrites, write atomically, and block legacy Markdown overwrite unless explicitly allowed.

Verification:
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm typecheck`

### S03: Plan Builder Navigation Shell

The desktop app now includes a workspace-aware Plan Builder view in the primary shell. Users can open it from the sidebar or from the New Thread start flow, and the shell presents the requested dark split-pane workbench with pane headers, active-pane styling, DISCUSS to SHIP phase flow, outline panel, and bottom composer bar.

Verification:
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm typecheck`

Known blockers:
- `pnpm --filter @pi-gui/desktop run test:e2e:core` is blocked by existing failures in integrated terminal, model/provider settings, and unread state specs outside the Plan Builder path.
- `pnpm run simplify` is unavailable because the repo has no `simplify` script.

## Next Slice

S04: Persisted DISCUSS Wizard.
