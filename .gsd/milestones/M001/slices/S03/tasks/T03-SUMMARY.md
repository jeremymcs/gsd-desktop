# T03 Summary: Desktop Verification

Added a desktop core spec for the Plan Builder navigation path. The targeted spec proves users can open Plan Builder from the sidebar and from the New Thread surface, with the expected workspace-aware title and active view state.

Verification:
- Passed: `pnpm --filter @pi-gui/desktop build`
- Passed: `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- Passed: `pnpm typecheck`
- Blocked: `pnpm --filter @pi-gui/desktop run test:e2e:core` failed in unrelated existing specs for integrated terminal state, model onboarding/provider settings expectations, and unread state.
- Blocked: `pnpm run simplify` failed because the repo has no `simplify` script.
