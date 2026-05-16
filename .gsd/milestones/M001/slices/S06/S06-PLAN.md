# S06: PLAN Proposal, Editing, and Validation

**Goal:** Let users turn accepted RESEARCH into a structured PLAN proposal, edit the hierarchy in the UI, and block approval when lightweight validation fails.
**Demo:** A workspace user accepts research, starts PLAN, edits milestones/slices/tasks/dependencies/boundaries, sees invalid dependencies block approval, fixes the issue, accepts the plan, restarts the app, and sees the accepted plan restored from `.gsd/gsd.db`.

## Must-Haves

- Start PLAN only after accepted RESEARCH exists.
- Seed a structured plan proposal from DISCUSS memory and accepted RESEARCH.
- Let users edit milestone, phase, slice, task, dependency, boundary, and idea-pool fields.
- Let users add/delete milestones, slices, and tasks.
- Persist proposed PLAN output through the planning event log.
- Validate required fields, dependency existence, self-dependencies, and dependency cycles.
- Block approval of invalid PLAN output in both the UI and main process.
- Restore accepted PLAN output after app restart.

## Tasks

- [x] **T01: Structured PLAN model and validator**
  Add typed proposal structures, serialization/parsing, deterministic seed generation, and lightweight validation.

- [x] **T02: PLAN store bridge**
  Add typed desktop state, narrow IPC methods, and main-process planning-store operations for PLAN start, propose, and review.

- [x] **T03: PLAN editor UI**
  Extend the Plan Builder workbench with structural editing controls, validation display, and plan review history.

- [x] **T04: Restart verification**
  Add desktop coverage for invalid dependency blocking, accepted plan persistence, run verification, and close the slice artifacts.

## Files Likely Touched

- `apps/desktop/src/desktop-state.ts`
- `apps/desktop/src/ipc.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/plan-builder-view.tsx`
- `apps/desktop/src/plan-builder-plan.ts`
- `apps/desktop/src/styles/main.css`
- `apps/desktop/electron/app-store.ts`
- `apps/desktop/electron/app-store-plans.ts`
- `apps/desktop/electron/main.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/tests/core/plan-builder.spec.ts`
