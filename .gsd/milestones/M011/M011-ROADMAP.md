# M011: Composer-Driven Phase Handoffs

**Vision:** The bottom Plan Builder composer should stay meaningful through phase transitions, not only during active DISCUSS questions.

**Success Criteria:**

- Composer action can start RESEARCH from the DISCUSS-complete state.
- Composer action can start PLAN from the accepted-research state.
- Composer action can start EXECUTE from the accepted-plan state.
- Handoff actions preserve existing card controls, readiness gates, and database events.

---

## Slices

- [x] **S01: Composer RESEARCH Handoff** `risk:medium` `depends:[M010]`
  > After this: a user can start RESEARCH from the bottom composer after DISCUSS gates are confirmed.

- [x] **S02: Composer PLAN Handoff** `risk:medium` `depends:[S01]`
  > After this: a user can start PLAN from the bottom composer after accepting research.

- [ ] **S03: Composer EXECUTE Handoff** `risk:medium` `depends:[S02]`
  > After this: a user can start EXECUTE from the bottom composer after accepting a valid plan.

## Boundary Map

### M010 -> S01

Produces:
  composer submit action -> active DISCUSS answer path and inactive status state

Consumes:
  research handoff action -> same `startResearch` path as visible UI

### S01 -> S02

Produces:
  composer phase action pattern -> non-question workflow action through bottom composer

Consumes:
  plan handoff action -> same `startPlan` path as visible UI

### S02 -> S03

Produces:
  accepted plan state -> execution readiness

Consumes:
  execute handoff action -> same `startExecution` path as visible UI
