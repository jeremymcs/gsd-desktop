# S05 Summary: Research Staging and Approval

Plan Builder now advances from confirmed DISCUSS into RESEARCH. Users can start research after the three depth gates are confirmed, edit a deterministic research brief seeded from discussion memory, stage findings as proposed database output, accept or reject proposed research, and see accepted research restored after app restart.

The implementation uses the existing planning event log:
- `stage.updated` starts and tracks the research stage.
- `generated-output.proposed` stores staged research.
- `generated-output.reviewed` stores accept/reject decisions.

Verification:
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm typecheck`
- `git diff --check`

Known blockers:
- `pnpm --filter @pi-gui/desktop run test:e2e:core` rebuilt successfully and the Plan Builder specs passed, but the lane is blocked by existing failures in integrated terminal, new-thread composer/model onboarding, provider settings, and unread state specs outside the Plan Builder path.
