# S07: End-to-End Desktop Verification - Summary

S07 connected the accepted PLAN state to the projection writer from the desktop app. The database remains canonical; `.gsd` Markdown files are generated after plan approval and can be regenerated from the UI after later discussion revisions.

Implemented:

- Added a projection adapter that maps accepted research and accepted plan proposal data into project, state, decisions, milestone, slice, and task projections.
- Added a desktop store method plus IPC/preload/renderer wiring for manual projection regeneration.
- Added a projection status card in the PLAN panel with a regenerate action.
- Extended the Plan Builder Electron regression to verify projection files, generated headers, manual regeneration after a revised answer, and restart persistence.

Verification:

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
