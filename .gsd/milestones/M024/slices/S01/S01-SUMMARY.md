# S01 Summary: Requirement References In PLAN

## Completed

- Added `requirementIds` to plan task drafts with legacy-safe normalization.
- Added task-level requirement reference entry in the plan proposal editor.
- Preserved requirement references when accepting, modifying, injecting, and restoring accepted plan tasks.
- Surfaced referenced requirement IDs in the accepted roadmap preview and persisted output.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists DISCUSS memory plus accepted RESEARCH and PLAN output across restart"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `git diff --check`
