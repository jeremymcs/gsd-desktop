# M006: Adaptive Planning Guidance

**Vision:** Plan Builder helps users strengthen weak planning answers by explaining what is missing, why it matters, and how to resolve it, while preserving explicit user input as the only canonical planning state.

**Success Criteria:**

- Adaptive follow-up cards distinguish low-detail answers from high-risk uncertainty.
- Saved discussion memory shows unresolved guidance that can be resolved through normal answer revision.
- Follow-up guidance can use prompt-source and requirement context without adding hidden database writes.
- Every user-visible adaptive guidance change is covered by Electron tests.

---

## Slices

- [x] **S01: Follow-Up Signal Detail** `risk:low` `depends:[M005/S04]`
  > After this: follow-up cards show deterministic severity and missing-context signals, helping users understand whether an answer needs a light edit or a stronger revision before it steers the plan.

- [x] **S02: Revision-Focused Resolution Loop** `risk:medium` `depends:[S01]`
  > After this: saved discussion memory makes unresolved follow-ups easier to resolve through the existing answer revision flow, without introducing synthetic answer events.

- [x] **S03: Requirement-Aware Guidance** `risk:medium` `depends:[S01,S02]`
  > After this: requirements-stage follow-ups can point at missing capability, quality, integration, or validation detail using the requirement contract already in state.

- [x] **S04: Phase Guidance Rollup** `risk:medium` `depends:[S02,S03]`
  > After this: the Plan Builder overview can summarize unresolved guidance by phase before users move from DISCUSS into RESEARCH, PLAN, EXECUTE, VERIFY, or SHIP.

## Boundary Map

### M005/S04 -> S01

Produces:
  adaptive follow-up suggestions -> question-specific prompt and rationale derived from existing answers

Consumes:
  follow-up signal detail -> severity and missing-context labels rendered in the same UI-only follow-up card

### S01 -> S02

Produces:
  follow-up severity and signals -> clearer revision intent for saved discussion memory

Consumes:
  resolution loop -> existing answer revision path remains the only way to change canonical memory

### S01 + S02 -> S03

Produces:
  deterministic guidance model -> safe extension point for requirement-aware checks
  revision loop -> user-owned resolution path for stronger guidance

Consumes:
  requirement-aware guidance -> follow-ups can reference requirement contract gaps without direct Markdown parsing

### S02 + S03 -> S04

Produces:
  unresolved guidance state derived from answers -> phase-level readiness signal

Consumes:
  phase guidance rollup -> overview of unresolved adaptive guidance before later lifecycle transitions
