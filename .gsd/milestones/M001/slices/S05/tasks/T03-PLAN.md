# T03: Restart Verification

## Goal

Prove research staging and approval survive app restart.

## Scope

- Extend the Plan Builder core spec through DISCUSS, RESEARCH staging, approval, and restart.
- Assert accepted research is visible after restart.
- Assert desktop state contains accepted research output from the planning snapshot.
- Run package and desktop verification appropriate to the changed surface.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm typecheck`
