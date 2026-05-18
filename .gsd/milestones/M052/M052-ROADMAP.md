# M052: GSD Source Proof Visual Language

**Vision:** Make the Plan Builder look like a GSD workbench where the proof is in the persisted plan source.

**Success Criteria:**

- Entry state includes source/projection demo panels with GSD language.
- Active plans include an operations/source inspector in the side rail.
- Styling stays accessible and coherent in the existing desktop app shell.

---

## Slices

- [x] **S01: Source Proof Panels** `risk:low` `depends:[M051]`
  > After this: users see GSD-specific source, projection, and workflow language before and during planning.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "creates a blank plan without starter template output"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "keeps Plan Builder workflow controls readable"`
