# S01: Legacy Reference Discovery

**Goal:** Discover existing GSD Markdown and persist it as reference context.

## Tasks

- [x] Scan `.gsd` Markdown files that are not generated projections.
- [x] Persist reference metadata without importing as canonical plan state.
- [x] Show references in Plan Builder.
- [x] Cover legacy/generated distinction in tests.

## Acceptance

- Legacy references are visible and generated files remain protected.

## Evidence

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "legacy GSD Markdown references"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm run simplify`
- `git diff --check`
