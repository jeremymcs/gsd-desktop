# S01: Run Activity Events

**Goal:** Persist and project recent autonomous run activity.

## Tasks

- [x] Add append-only run activity records.
- [x] Record resume attempts and stop updates.
- [x] Render the activity ledger in Plan Builder.
- [x] Include a compact ledger in `.gsd/NEXT.md`.

## Acceptance

- A restarted app explains the recent autonomous run sequence.

## Evidence

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "run recovery summary"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm run simplify`
- `git diff --check`
