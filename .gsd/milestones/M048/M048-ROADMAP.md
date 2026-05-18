# M048: Settings Model Policy Polish

**Vision:** Make phase model routing understandable before execution starts.

**Success Criteria:**

- Global and project-level model policy are easy to compare.
- Missing model routes are visible without digging.
- Existing execution model persistence remains intact.

---

## Slices

- [x] **S01: Model Policy Comparison UI** `risk:low` `depends:[M041]`
  > After this: users can compare global phase defaults and project overrides from the planning surfaces.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists DISCUSS memory"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/timeline-pinning.spec.ts --grep "keeps a reopened virtualized long transcript stable"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/new-thread-auto-title.spec.ts --grep "manual rename beats"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/queued-messages.spec.ts --grep "delineates queued follow-ups"`
- `pnpm lint`
- `pnpm simplify`
- `git diff --check`
