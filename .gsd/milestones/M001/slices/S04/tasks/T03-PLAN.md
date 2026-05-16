# T03: Restart Verification

## Goal

Prove the persisted wizard works on the Electron surface and close the slice.

## Scope

- Extend the Plan Builder core spec with database persistence and answer revision coverage.
- Run package and desktop verification.
- Record pass/fail status and known blockers.

## Verification

- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm typecheck`
