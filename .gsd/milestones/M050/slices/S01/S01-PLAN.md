# S01: Derived Run Report

**Goal:** Generate a concise report from run activity, recovery, evidence, and next work.

## Tasks

- [x] Build report text from database-backed planning state.
- [x] Render the report near handoff or ship surfaces.
- [x] Include guardrail and next-work summaries.
- [x] Cover report generation in Electron tests.

## Acceptance

- A user can read or copy one report that explains what happened overnight and what to do next.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists run recovery summary"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "starts SHIP from the Plan Builder composer handoff"`
