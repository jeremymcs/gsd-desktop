# T01: Projection types and renderers

**Slice:** S02
**Milestone:** M001

## Goal

Define typed projection inputs and render planning-phase Markdown files.

## Must-Haves

### Truths

- Rendered projection paths match the GSD workflow layout.
- Rendered files include generated ownership metadata.
- Requirements render into Active, Validated, Deferred, Out of Scope, Traceability, and Coverage Summary sections.
- Roadmaps render slices and boundary maps with stable readable IDs.
- Slice and task plans render mechanically checkable must-haves.

### Artifacts

- `packages/gsd-planning/src/projections.ts` - projection types and render functions.
- `packages/gsd-planning/src/index.ts` - public projection exports.

### Key Links

- `PlanSnapshot`/projection input -> generated Markdown file list.
- Readable IDs -> filenames and headings.
- Hidden DB metadata -> generated header.

## Steps

1. Define projection input types for project, requirements, state, decisions, milestone, slice, and task data.
2. Render each planning-phase artifact with stable Markdown.
3. Keep renderer pure: no filesystem access in this task.

## Context

- DB remains canonical; renderers produce views only.
- S06 will later supply richer hierarchy data, so S02 should accept typed projection input without hard-coding current UI state.

