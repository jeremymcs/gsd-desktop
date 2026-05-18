# S01: Deterministic Guardrail Warnings

**Goal:** Surface locally detectable autonomous-run guardrail warnings.

## Tasks

- [x] Compute projection conflict and stale-state warnings.
- [x] Show warnings near queue and recovery actions.
- [x] Keep warning computation deterministic.
- [x] Cover warnings in package and Electron tests.

## Acceptance

- Users see local guardrail warnings before starting autonomous work.

## Verification

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists run recovery summary"`
- `pnpm --filter @pi-gui/desktop test:e2e:runner -- apps/desktop/tests/core`
- `pnpm lint`
- `pnpm simplify`
