# M046: Verification Evidence Export

**Vision:** Make verification handoff easy to review outside the live UI.

**Success Criteria:**

- Users can copy a concise evidence report.
- Report content reflects task execution and verification records.
- Gaps are clearly called out.

---

## Slices

- [x] **S01: Copyable Evidence Report** `risk:low` `depends:[M030]`
  > After this: VERIFY has a copyable report of task evidence, verification state, and gaps.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "starts VERIFY"`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`
- `pnpm lint`
- `pnpm simplify`
- `git diff --check`
