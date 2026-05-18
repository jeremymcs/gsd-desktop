# M050: Overnight Run Report

**Vision:** Give users a morning-after summary of autonomous work.

**Success Criteria:**

- Users can inspect or copy an overnight report.
- Report content comes from durable plan records and run activity.
- Next recommended action is explicit.

---

## Slices

- [x] **S01: Derived Run Report** `risk:medium` `depends:[M034,M036,M042]`
  > After this: users can review a durable overnight run report after autonomous work.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "persists run recovery summary"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "starts SHIP from the Plan Builder composer handoff"`
