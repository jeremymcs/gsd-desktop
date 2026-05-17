# S02: Composer Change-Draft Handoff

**Goal:** Let users start the existing change-draft form from the composer review follow-up after preparing a parked idea.

## Tasks

- [x] Show a Draft change action for prepared composer-review items.
- [x] Keep duplicate proposal protection by reusing the existing `changeProposalsBySource` check.
- [x] Open the existing idea-pool draft form rather than creating a second composer-only draft editor.
- [x] Add Electron coverage for Prepare -> Draft change -> Save draft.

## Acceptance

- A prepared composer-parked idea shows Draft change in the composer follow-up.
- Clicking Draft change opens the existing draft form for that idea.
- Saving the draft creates a persisted change proposal.
- Empty-composer phase handoffs remain unchanged.
