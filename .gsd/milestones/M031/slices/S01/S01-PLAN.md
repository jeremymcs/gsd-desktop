# S01: Projection Drift Status

**Goal:** Detect and repair generated projection drift.

## Tasks

- [x] Add projection drift comparison against current generated content.
- [x] Show drift status in Plan Builder.
- [x] Repair generated files while preserving legacy conflict protection.
- [x] Cover drift cases in package and Electron tests.

## Acceptance

- Missing or stale generated files can be repaired.
- Legacy files still require explicit overwrite.

## Evidence

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists DISCUSS memory"`
