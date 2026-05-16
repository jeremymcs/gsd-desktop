# S03 Summary: Plan Builder Navigation Shell

The desktop app now has a workspace-aware Plan Builder view on the primary shell. Users can open it from the sidebar `Plans` entry or from the New Thread `Plan a new project` action. The first UI shell follows the requested dark split-pane workbench direction with pane headers, active-pane styling, the DISCUSS to SHIP phase path, outline counts, workspace switching, and a bottom composer bar.

This slice intentionally does not persist wizard answers yet. S04 will connect the shell to the planning database and DISCUSS state machine.

## Verification

- Passed: `pnpm --filter @pi-gui/desktop typecheck`
- Passed: `pnpm --filter @pi-gui/desktop build`
- Passed: `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- Passed: `pnpm typecheck`
- Blocked: `pnpm --filter @pi-gui/desktop run test:e2e:core`
  - `apps/desktop/tests/core/integrated-terminal.spec.ts`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts`
  - `apps/desktop/tests/core/provider-settings.spec.ts`
  - `apps/desktop/tests/core/unread-state.spec.ts`
- Blocked: `pnpm run simplify` because no `simplify` script exists.
