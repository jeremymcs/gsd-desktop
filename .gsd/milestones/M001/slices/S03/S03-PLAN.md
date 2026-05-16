# S03: Plan Builder Navigation Shell

**Goal:** Add the first desktop Plan Builder surface, wired into the existing app navigation and shaped like the dark split-pane workbench direction.
**Demo:** A workspace user can open Plan Builder from the sidebar or New Thread start flow and see a workspace-aware planning shell with phase navigation, pane headers, active-pane styling, and a bottom composer bar.

## Must-Haves

- Add a typed `plans` app view without introducing a second routing system.
- Add a sidebar Plan Builder entry that preserves the current workspace context.
- Add a "Plan a new project" entry from the New Thread surface.
- Render a dark split-pane workbench shell with pane headers, active-pane border, phase strip, outline pane, and composer bar.
- Keep the shell non-destructive and scoped to navigation/UI; persisted wizard writes land in S04.
- Cover the visible navigation path with an Electron core spec.

## Tasks

- [x] **T01: App view wiring**
  Extend top-level view state, sidebar navigation, topbar title state, and root workspace selection for Plan Builder.

- [x] **T02: Workbench shell UI**
  Add the Plan Builder shell component and styling, then add a New Thread entry point into that view.

- [x] **T03: Desktop verification**
  Add core Playwright coverage and run the desktop verification lane.

## Files Likely Touched

- `apps/desktop/src/desktop-state.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/sidebar.tsx`
- `apps/desktop/src/topbar.tsx`
- `apps/desktop/src/new-thread-view.tsx`
- `apps/desktop/src/plan-builder-view.tsx`
- `apps/desktop/src/icons.tsx`
- `apps/desktop/src/styles/main.css`
- `apps/desktop/tests/core/plan-builder.spec.ts`
- `.gsd/milestones/M001/M001-ROADMAP.md`
- `.gsd/milestones/M001/slices/S03/*`
