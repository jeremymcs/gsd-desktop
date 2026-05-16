# S02: Projection Generator and Adoption Safety

**Goal:** Add generated Markdown projection support to the shared planning package, with ownership headers, changed-file-only atomic writes, and legacy-file protection.
**Demo:** Package tests can render planning-phase GSD files from typed plan data, write them under `.gsd/`, skip unchanged files on regeneration, and block overwriting legacy Markdown without explicit approval.

## Must-Haves

- Projection models cover planning-phase files: `PROJECT.md`, `REQUIREMENTS.md`, `STATE.md`, `DECISIONS.md`, `M###-CONTEXT.md`, `M###-RESEARCH.md`, `M###-ROADMAP.md`, `S##-CONTEXT.md`, `S##-PLAN.md`, and `T##-PLAN.md`.
- Generated files include a stable ownership header identifying `.gsd/gsd.db` as canonical and carrying hidden plan/revision metadata.
- Projection writers create only changed files and skip unchanged files.
- Writes are atomic through temp-file-and-rename behavior.
- Existing files without the generated ownership header are treated as legacy and blocked unless the caller explicitly allows overwrite.
- Manual regeneration is exposed as a package API that takes typed projection input and writes the generated file set.
- Package tests cover render paths/content, changed-file skipping, legacy conflict handling, and explicit overwrite.

## Tasks

- [x] **T01: Projection types and renderers**
  Define projection input/output types and render Markdown for project, requirements, state, decisions, roadmap, context, research, slice plans, and task plans.

- [x] **T02: Safe projection writer**
  Implement ownership detection, legacy conflict handling, changed-file skipping, atomic writes, and manual regeneration API.

- [x] **T03: Projection tests and slice closeout**
  Add focused package tests, run package/root verification, and update S02 summaries.

## Files Likely Touched

- `packages/gsd-planning/src/projections.ts`
- `packages/gsd-planning/src/projection-writer.ts`
- `packages/gsd-planning/src/index.ts`
- `packages/gsd-planning/src/types.ts`
- `packages/gsd-planning/test/projections.test.mjs`
- `.gsd/milestones/M001/M001-ROADMAP.md`
- `.gsd/milestones/M001/slices/S02/*`
