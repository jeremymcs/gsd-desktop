# S04 Summary: Persisted DISCUSS Wizard

Plan Builder now creates and resumes database-backed plans from the desktop UI. The DISCUSS flow asks project, requirements, and milestone questions, persists each answer to `.gsd/gsd.db`, advances through depth gates, supports parked non-load-bearing notes, and lets users revise prior answers through revision events. The outline pane now restores saved plan state, stage progress, answer memory, and revisions after app restart.

The desktop main process owns SQLite access through narrow planning IPC methods. The renderer receives typed planning state through the existing app-state publisher. Native module scripts now explicitly rebuild `better-sqlite3` for the right runtime: Node for planning package tests and Electron for desktop build/dev/preview.

## Verification

- Passed: `pnpm --filter @pi-gui/gsd-planning test`
- Passed: `pnpm --filter @pi-gui/desktop typecheck`
- Passed: `pnpm --filter @pi-gui/desktop build`
- Passed: `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- Passed: `pnpm typecheck`
- Passed: `git diff --check`
- Blocked: `pnpm --filter @pi-gui/desktop run test:e2e:core`
  - `apps/desktop/tests/core/integrated-terminal.spec.ts`
  - `apps/desktop/tests/core/new-thread-auto-title.spec.ts`
  - `apps/desktop/tests/core/new-thread-composer.spec.ts`
  - `apps/desktop/tests/core/provider-settings.spec.ts`
  - `apps/desktop/tests/core/unread-state.spec.ts`
- Blocked: `pnpm run simplify` because no `simplify` script exists.

## Notes

The full core lane passed the Plan Builder specs inside the lane. Its remaining failures are outside the Plan Builder path.
