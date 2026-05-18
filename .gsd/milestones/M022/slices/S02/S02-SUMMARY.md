# S02 Summary: Restore Dismissed Ideas

## Completed

- Added a restore action for dismissed parked ideas in the composer review surface and idea pool.
- Reused the existing append-only `idea.reviewed` event with `status: "parked"` for restoration.
- Limited dismissed ideas to `Edit idea` and `Restore` actions so keep/prepare/dismiss only return after restore.
- Added store replay coverage for dismiss -> restore across reopen.
- Added Electron core coverage for dismissing, restoring, restarting, and preparing the restored idea again.

## Verification

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "restores a dismissed composer draft idea after restart"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `git diff --check`
