# S01: Plan-Level Evidence Ledger

**Goal:** Add a compact plan-level evidence ledger.

## Tasks

- [x] Derive evidence rows from task execution and verification records.
- [x] Show the ledger in Plan Builder.
- [x] Include evidence status in generated handoff output.
- [x] Cover restart persistence and source session labels.

## Acceptance

- Evidence rows identify task path, status, source session, and verification state.

## Evidence

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "shows next work ordering"`
