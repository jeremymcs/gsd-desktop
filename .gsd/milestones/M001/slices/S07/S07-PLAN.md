# S07: End-to-End Desktop Verification

**Goal:** Prove the first Plan Builder milestone on the real Electron surface, including generated projection files and manual regeneration from database state.

## Tasks

- [x] **T01: Projection input adapter**
  Convert accepted PLAN output plus accepted RESEARCH output into `GeneratePlanningProjectionsInput` without making Markdown the source of truth.

- [x] **T02: Desktop regenerate bridge**
  Add IPC, store, preload, and renderer wiring for automatic projection writes after PLAN approval and manual regeneration from the PLAN panel.

- [x] **T03: Electron regression coverage**
  Extend the Plan Builder Playwright flow to assert generated `.gsd` files, manual regeneration after a revised answer, and restart persistence.

## Acceptance

- PLAN approval writes generated Markdown projections with ownership headers.
- Manual regeneration refreshes projection files after canonical database state changes.
- Restarted desktop state still shows accepted research, accepted plan output, and revised discussion memory.
- Targeted Electron coverage passes against the built app.
