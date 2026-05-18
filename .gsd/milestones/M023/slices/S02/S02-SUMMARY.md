# S02 Summary: Proposal Card Timeline

## Completed

- Added a collapsed proposal history control to change proposal cards.
- Rendered lifecycle entries with readable labels for drafted, edited, deleted, approved, modified, hidden, and restored events.
- Kept proposal cards dense by hiding the timeline until the user expands `History`.
- Added Electron coverage for modification and injection histories, including hide/restore ordering and restart replay.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists DISCUSS memory plus accepted RESEARCH and PLAN output across restart"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `git diff --check`
