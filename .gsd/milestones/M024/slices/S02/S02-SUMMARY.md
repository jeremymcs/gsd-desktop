# S02 Summary: Coverage Validation Gate

## Completed

- Added requirement-aware PLAN validation for unknown task requirement references.
- Reused the same requirement rows in renderer and Electron mutation guards so accepted-plan edits keep valid refs valid.
- Added non-blocking coverage warnings for active requirements with no task coverage.
- Rendered coverage warnings while drafting, in plan review cards, and next to accepted-plan execution controls.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists DISCUSS memory plus accepted RESEARCH and PLAN output across restart"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `git diff --check`
