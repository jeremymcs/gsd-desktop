# T04: Restart Verification

## Goal

Prove PLAN proposal editing, validation, approval, and persistence survive app restart.

## Scope

- Extend the Plan Builder core spec through DISCUSS, RESEARCH, PLAN editing, invalid dependency blocking, approval, and restart.
- Assert accepted PLAN output is visible after restart.
- Assert desktop state contains accepted roadmap output from the planning snapshot.
- Run package and desktop verification appropriate to the changed surface.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm typecheck`
