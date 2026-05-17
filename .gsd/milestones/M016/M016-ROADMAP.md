# M016: Composer-Driven Change Proposal Review

**Vision:** A composer-origin change request should stay guided through proposal review while preserving the existing explicit approval forms.

**Success Criteria:**

- A drafted composer idea can focus its proposal review surface from the composer.
- The proposal review form remains the existing side-pane form.
- The handoff is keyboard-friendly and phase-preserving.
- Electron coverage exercises the real desktop surface.

---

## Slices

- [x] **S01: Composer Proposal Review Focus** `risk:low` `depends:[M015]`
  > After this: a drafted composer idea exposes Review proposal, which focuses the existing proposal approval form.

## Boundary Map

### M015 -> S01

Produces:
  drafted composer idea -> visible change proposal tied to the parked note

Consumes:
  proposal review focus -> composer action that moves the user into the existing approval form
