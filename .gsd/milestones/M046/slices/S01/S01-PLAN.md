# S01: Copyable Evidence Report

**Goal:** Add a database-backed evidence report for handoff and review.

## Tasks

- [x] Build the report from task execution and verification records.
- [x] Render a copyable report panel near the verification/evidence ledger.
- [x] Include gaps for missing evidence or failed verification.
- [x] Cover report content in Electron tests.

## Acceptance

- A user can copy one report that explains what passed, what evidence exists, and what remains.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "starts VERIFY"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm simplify`
- `git diff --check`
