# T03: Desktop Verification

## Goal

Prove the Plan Builder shell works on the Electron surface and close the slice artifacts.

## Scope

- Add targeted Playwright coverage under `apps/desktop/tests/core`.
- Run targeted Plan Builder coverage while iterating.
- Run the owning desktop core lane before closeout.
- Update S03 summary, UAT, and milestone status.

## Verification

- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm typecheck`
