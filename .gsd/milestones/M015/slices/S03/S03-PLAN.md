# S03: Composer Draft Focus Handoff

**Goal:** Keep keyboard flow intact when the composer opens the existing change-draft form.

## Tasks

- [x] Add a ref for the active change-draft title input.
- [x] Focus and center the draft form after `draftingIdeaId` changes.
- [x] Extend Electron coverage for composer Draft change focus.
- [x] Keep existing side-pane draft behavior unchanged.

## Acceptance

- Clicking Draft change from the composer focuses the draft title input.
- The existing draft form remains the only editor for change proposal details.
- Saving the draft still creates a persisted change proposal.
