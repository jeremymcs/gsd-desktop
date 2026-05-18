# S01: Reference Promotion To Idea Pool

**Goal:** Promote selected legacy reference context into the idea pool.

## Tasks

- [x] Add reference action to park excerpt as an idea.
- [x] Preserve source path in the parked idea rationale.
- [x] Keep legacy Markdown read-only.
- [x] Cover promotion and restart in Electron.

## Acceptance

- A promoted reference appears as a normal database-backed idea.

## Evidence

- `pnpm --filter @pi-gui/gsd-planning typecheck`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "legacy GSD Markdown references"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm run simplify`
- `git diff --check`
