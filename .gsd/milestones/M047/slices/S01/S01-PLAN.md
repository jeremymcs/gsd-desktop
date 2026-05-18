# S01: Starter Template Selection

**Goal:** Add a small, safe template option to new plan creation.

## Tasks

- [x] Define local starter templates and what they may prefill.
- [x] Add a template selector to plan creation.
- [x] Persist template choice as plan state or generated output metadata.
- [x] Cover default and templated creation in Electron tests.

## Acceptance

- A user can start from a template while still editing and confirming the resulting plan.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "starter template|starter template output"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm simplify`
- `git diff --check`
