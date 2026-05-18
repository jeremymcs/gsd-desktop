# S01: Global Workbench Shell

**Goal:** Establish the app-wide GSD visual foundation before deeper view-specific redesigns.

## Tasks

- [x] Add GSD identity and phase language to the desktop shell.
- [x] Apply the reference-image composition: framed workbench, command list, source/diff rail, and bottom composer emphasis.
- [x] Retune shared light/dark tokens around a source/workbench palette.
- [x] Restyle shared composer, timeline, settings, capability, and diff surfaces.
- [x] Keep existing navigation names stable for tests and learned app behavior.

## Acceptance

- The whole app reads as a GSD workbench, not only the Plan Builder.
- Existing core navigation and Plan Builder entry remain functional.

## Verification

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/skills-settings.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/new-thread-composer.spec.ts --grep "keeps composer controls readable"`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts --grep "opens the workspace-aware Plan Builder from sidebar and New Thread"`
- `pnpm lint`
- `pnpm simplify`
