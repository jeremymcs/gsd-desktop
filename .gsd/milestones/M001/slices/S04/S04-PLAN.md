# S04: Persisted DISCUSS Wizard

**Goal:** Turn the Plan Builder shell into a persisted DISCUSS wizard backed by `.gsd/gsd.db`.
**Demo:** A workspace user can create a plan, answer project/requirements/milestone questions, revise prior answers, confirm depth gates, and reopen the app with the plan outline restored.

## Must-Haves

- Load and select plans per root workspace from the planning database.
- Create new named plans from the Plan Builder UI.
- Persist DISCUSS answers as append-only planning events.
- Persist answer revisions with optimistic revision checks.
- Drive project, requirements, and milestone stages through prompt-compatible depth gates.
- Show a compact outline and answer history after restart.
- Cover the visible restart flow with an Electron core spec.

## Tasks

- [x] **T01: Planning store bridge**
  Add typed desktop state, narrow IPC methods, and main-process planning-store operations.

- [x] **T02: DISCUSS wizard UI**
  Replace the shell-only Plan Builder body with create-plan, question, revision, and depth-confirmation flows.

- [x] **T03: Restart verification**
  Add desktop coverage for persistence/revision, run verification, and close the slice artifacts.

## Files Likely Touched

- `apps/desktop/src/desktop-state.ts`
- `apps/desktop/src/ipc.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/plan-builder-view.tsx`
- `apps/desktop/src/plan-builder-discuss.ts`
- `apps/desktop/src/styles/main.css`
- `apps/desktop/electron/app-store.ts`
- `apps/desktop/electron/app-store-plans.ts`
- `apps/desktop/electron/main.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/tests/core/plan-builder.spec.ts`
- `apps/desktop/package.json`
- `apps/desktop/tsconfig.paths.json`
