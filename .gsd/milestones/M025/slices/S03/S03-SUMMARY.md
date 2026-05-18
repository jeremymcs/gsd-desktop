# S03 Summary: Evidence Back-Link

S03 links task evidence back to the session that produced it when evidence is recorded for a linked task.

## Shipped

- Task evidence now stores linked session source metadata when available.
- Planning store replay preserves evidence source session id and title.
- The execution queue shows the evidence text with its linked session source.
- Manual evidence entry remains unchanged for unlinked tasks.
- Existing VERIFY and SHIP views continue to consume the same saved evidence.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists DISCUSS memory plus accepted RESEARCH and PLAN output across restart"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/new-thread-auto-title.spec.ts --grep "reopen heals a stale placeholder catalog title after auto-title finished"`
- `pnpm lint`
- `git diff --check`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
