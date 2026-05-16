# T02 Summary: Workbench Shell UI

Added the Plan Builder workbench shell with split panes, pane chips, active-pane styling, workflow phase strip, outline panel, workspace picker, and a bottom planning composer affordance. New Thread now includes a "Plan a new project" entry that opens the Plan Builder for the selected root workspace.

Verification:
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm typecheck`
