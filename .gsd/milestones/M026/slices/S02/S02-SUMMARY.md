# S02 Summary: Next Work Panel

## Completed

- Added a Plan Builder next work panel above the execution queue.
- Shows ready and blocked counts, task order, dependency blockers, and explicit blocker reasons.
- Routes ready items into the existing task session controls and opens already-linked sessions.
- Kept renderer imports browser-safe by exposing the scheduler through `@pi-gui/gsd-planning/next-work`.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "shows next work ordering"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `git diff --check`

## Notes

- Running the planning package test rebuilds `better-sqlite3` for Node. Rebuild desktop native modules before Electron tests after that package test.
