# S01: Guardrail Policy Projection

**Goal:** Make stop conditions explicit wherever queued work is started.

## Tasks

- [x] Add typed guardrail defaults to run policy.
- [x] Show guardrails in the execution handoff surface.
- [x] Project guardrails into `.gsd/NEXT.md`.
- [x] Cover persistence and generated output.

## Acceptance

- A new session can read the guardrails without opening the app.

## Evidence

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "shows next work ordering|persists DISCUSS memory"`
