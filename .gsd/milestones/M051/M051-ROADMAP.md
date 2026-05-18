# M051: Plan Builder Visual Density Pass

**Vision:** Make active planning feel like a dense desktop work surface instead of a landing page.

**Success Criteria:**

- Active plans use compact, left-aligned title treatment.
- Cards and workflow panels scan cleanly without inflated vertical rhythm.
- Responsive behavior remains stable.

---

## Slices

- [x] **S01: Compact Active Plan Header** `risk:low` `depends:[M050]`
  > After this: the active wizard opens with a tighter Codex-style workbench header and less hero visual weight.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "starts SHIP from the Plan Builder composer handoff"`
