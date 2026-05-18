# S01: Source Proof Panels

**Goal:** Add GSD-specific source/projection visual panels inspired by the reference desktop design.

## Tasks

- [x] Add a GSD source proof panel to the no-plan state.
- [x] Add a GSD operations inspector to the active side rail.
- [x] Style the panels as dark desktop source windows with restrained accent color.
- [x] Verify typecheck/build and focused Plan Builder smoke.

## Acceptance

- The UI communicates DISCUSS > RESEARCH > PLAN > EXECUTE > VERIFY > SHIP through database-backed source and projection terminology.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "creates a blank plan without starter template output"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "keeps Plan Builder workflow controls readable"`
