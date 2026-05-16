# S05: Research Staging and Approval

**Goal:** Let users move from confirmed DISCUSS context into RESEARCH, stage findings as proposed database output, and accept or reject them from the Plan Builder UI.
**Demo:** A workspace user confirms DISCUSS, starts RESEARCH, stages research findings, accepts the proposed output, restarts the app, and sees the accepted research restored from `.gsd/gsd.db`.

## Must-Haves

- Start RESEARCH only after project, requirements, and milestone depth gates are confirmed.
- Persist proposed research output through the planning event log.
- Review staged research in the UI before it becomes accepted planning state.
- Support rejection so users can revise or replace findings before PLAN.
- Restore accepted research output after app restart.
- Cover the visible restart flow with an Electron core spec.

## Tasks

- [x] **T01: Research store bridge**
  Add typed desktop state, narrow IPC methods, and main-process planning-store operations for research start, propose, and review.

- [x] **T02: Research review UI**
  Extend the Plan Builder workbench with RESEARCH staging, proposed output review, and accepted/rejected output history.

- [x] **T03: Restart verification**
  Add desktop coverage for research persistence/review, run verification, and close the slice artifacts.

## Files Likely Touched

- `apps/desktop/src/desktop-state.ts`
- `apps/desktop/src/ipc.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/plan-builder-view.tsx`
- `apps/desktop/src/styles/main.css`
- `apps/desktop/electron/app-store.ts`
- `apps/desktop/electron/app-store-plans.ts`
- `apps/desktop/electron/main.ts`
- `apps/desktop/electron/preload.ts`
- `apps/desktop/tests/core/plan-builder.spec.ts`
