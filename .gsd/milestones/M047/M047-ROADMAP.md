# M047: Plan Template Library

**Vision:** Speed up common plan starts while preserving guided confirmation.

**Success Criteria:**

- Users can choose a starter template during plan creation.
- Template output remains editable and database-backed.
- Default plan creation remains unchanged.

---

## Slices

- [x] **S01: Starter Template Selection** `risk:medium` `depends:[M001]`
  > After this: users can create a plan from a local starter template without losing normal DISCUSS flow.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "starter template|starter template output"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm simplify`
- `git diff --check`
