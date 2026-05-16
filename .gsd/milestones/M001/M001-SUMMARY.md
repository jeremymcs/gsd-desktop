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

### S04: Persisted DISCUSS Wizard

Plan Builder now creates database-backed plans and drives users through Project, Requirements, and Milestone DISCUSS questions. Answers persist immediately to `.gsd/gsd.db`, stage depth gates advance through the UI, parked notes can be captured as non-load-bearing memory, and previous answers can be revised through append-only revision events. The outline pane restores plan state, progress, and revised discussion memory after app restart.

Verification:
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm typecheck`

Known blockers:
- `pnpm --filter @pi-gui/desktop run test:e2e:core` is blocked by existing failures in integrated terminal, new-thread auto-title, model/provider settings, and unread state specs outside the Plan Builder path.
- `pnpm run simplify` is unavailable because the repo has no `simplify` script.

### S05: Research Staging and Approval

Plan Builder now advances from confirmed DISCUSS into RESEARCH. Users can start research after the three depth gates are confirmed, edit a deterministic research brief seeded from persisted discussion memory, stage findings as proposed database output, accept or reject proposed research, and restore accepted research after app restart.

Verification:
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm typecheck`
- `git diff --check`

Known blockers:
- `pnpm --filter @pi-gui/desktop run test:e2e:core` rebuilt successfully and the Plan Builder specs passed, but the lane is blocked by existing failures in integrated terminal, new-thread composer/model onboarding, provider settings, and unread state specs outside the Plan Builder path.
- `pnpm run simplify` is unavailable because the repo has no `simplify` script.

## Next Slice

S06: PLAN Proposal, Editing, and Validation.
