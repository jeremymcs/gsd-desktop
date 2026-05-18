# M024: Requirement Coverage Mapping

**Vision:** Connect requirements to executable plan structure before work starts.

**Success Criteria:**

- Tasks or slices can carry requirement references.
- Unknown references are validation errors.
- Uncovered active requirements are visible before EXECUTE.

---

## Slices

- [x] **S01: Requirement References In PLAN** `risk:high` `depends:[M023]`
  > After this: PLAN task or slice rows can reference requirement IDs and accepted plan output persists those references.

- [x] **S02: Coverage Validation Gate** `risk:medium` `depends:[S01]`
  > After this: users see unknown and uncovered requirement warnings before accepting or executing a plan.

- [ ] **S03: Coverage Projection** `risk:medium` `depends:[S01,S02]`
  > After this: generated requirement and roadmap projections show which plan items cover each active requirement.

## Boundary Map

### Requirements contract -> S01

Produces:
  stable requirement IDs -> traceable capability records

Consumes:
  requirement references -> plan item coverage fields

### S01 -> S02

Produces:
  plan item coverage -> declared requirement ownership

Consumes:
  validation gate -> unknown reference errors and uncovered requirement warnings

### S02 -> S03

Produces:
  validated coverage map -> projection-safe requirement traceability

Consumes:
  Markdown coverage tables -> reviewable execution contract
