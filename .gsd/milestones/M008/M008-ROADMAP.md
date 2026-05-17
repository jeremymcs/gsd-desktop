# M008: Phase-Aware Plan Structure

**Vision:** Users can structure PLAN output with explicit phases between milestones and slices, and those phases remain durable in accepted PLAN JSON plus generated Markdown projections.

**Success Criteria:**

- Phase rows are part of the PLAN proposal model.
- Milestones must point to a real phase before approval.
- The PLAN editor exposes phase editing and milestone assignment.
- Projection files show the phase sequence and milestone phase membership.
- Restart coverage proves accepted phases persist.

---

## Slices

- [x] **S01: Phase Draft Model and Validation** `risk:medium` `depends:[M007]`
  > After this: PLAN proposal JSON includes top-level phase rows, backward-compatible parsing derives phases for old JSON, and validation blocks invalid phase references.

- [x] **S02: Phase Editor and Assignment UI** `risk:medium` `depends:[S01]`
  > After this: users can add, edit, delete, and assign phases from the PLAN editor instead of typing an unvalidated milestone phase.

- [ ] **S03: Phase-Aware Projections and Restart Coverage** `risk:medium` `depends:[S01,S02]`
  > After this: generated Markdown exposes phase sequencing, and Electron tests prove accepted phases survive projection regeneration and restart.

## Boundary Map

### M007 -> S01

Produces:
  readiness-gated PLAN flow -> accepted PLAN JSON remains the handoff source

Consumes:
  phase draft model -> explicit phase rows and validation layered onto existing proposal JSON

### S01 -> S02

Produces:
  typed phase rows -> stable IDs and milestone references

Consumes:
  PLAN editor controls -> phase CRUD and milestone assignment controls

### S01 + S02 -> S03

Produces:
  accepted phase-aware plan -> projection input can expose phase sequence

Consumes:
  generated Markdown -> PROJECT, milestone context, and roadmap show phase membership
