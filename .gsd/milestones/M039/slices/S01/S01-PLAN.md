# S01: Active Plan Handoff Text

**Goal:** Generate a compact handoff summary from the active plan.

## Tasks

- [x] Build deterministic handoff text from plan state.
- [x] Show copyable handoff in Plan Builder.
- [x] Include next work and recovery summary.
- [x] Cover generated handoff content in tests.

## Acceptance

- A user can hand another session enough context to resume safely.

## Evidence

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "run recovery"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm run simplify`
- `git diff --check`
