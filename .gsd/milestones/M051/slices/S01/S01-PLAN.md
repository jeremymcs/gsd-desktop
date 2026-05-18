# S01: Compact Active Plan Header

**Goal:** Reduce active Plan Builder visual bulk while keeping the create-plan hero intact.

## Tasks

- [x] Compact the active wizard title and intro copy.
- [x] Hide decorative hero mark in active wizard mode.
- [x] Tighten workflow spacing and content widths.
- [x] Verify CSS/build and a focused Plan Builder Electron smoke path.

## Acceptance

- Once a plan exists, the first screen feels like a desktop workbench, not a landing page.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "starts SHIP from the Plan Builder composer handoff"`
