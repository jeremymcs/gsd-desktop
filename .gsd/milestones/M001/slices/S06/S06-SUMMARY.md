# S06 Summary: PLAN Proposal, Editing, and Validation

Plan Builder now advances from accepted RESEARCH into PLAN. Users can start PLAN, edit a structured proposal with boundary map, idea pool, milestones, phases, slices, tasks, and dependencies, stage proposed PLAN output, and accept or reject it from the UI.

PLAN output uses the existing generated-output event model with stage `roadmap`. The proposal content is structured JSON so future projection work can read it deterministically from `.gsd/gsd.db`.

Validation now blocks approval for missing required fields, unknown dependencies, self-dependencies, and dependency cycles. The UI disables invalid staged PLAN acceptance, and the main process validates again before accepting to prevent renderer bypass.

Verification:
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm typecheck`
- `git diff --check`

Known blockers:
- `pnpm --filter @pi-gui/desktop run test:e2e:core` rebuilt successfully and the Plan Builder specs passed, but the lane is blocked by existing failures in integrated terminal, new-thread composer/model onboarding, provider settings, and unread state specs outside the Plan Builder path.
- `pnpm run simplify` is unavailable because the repo has no `simplify` script.
