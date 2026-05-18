# M027 Summary: Start Next Work From Queue

## Completed

- Added a primary next-work header action that targets the first ready task.
- The action creates and opens an unlinked ready task session.
- The same action opens the existing linked task session after the task has a link.
- Restart coverage confirms the first ready task remains stable.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "shows next work ordering"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `git diff --check`
