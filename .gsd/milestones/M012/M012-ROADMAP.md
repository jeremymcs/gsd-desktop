# M012: Composer-Driven Completion Handoffs

**Vision:** The bottom Plan Builder composer should remain useful through completion gates, not only through the start of EXECUTE.

**Success Criteria:**

- Composer action can start VERIFY from an evidence-complete EXECUTE state.
- Composer action can start SHIP from an all-passed VERIFY state.
- Existing card controls and readiness gates remain intact.
- Electron tests cover both user-visible handoffs.

---

## Slices

- [x] **S01: Composer VERIFY Handoff** `risk:medium` `depends:[M011]`
  > After this: a user can start VERIFY from the bottom composer once every active task is done with evidence.

- [x] **S02: Composer SHIP Handoff** `risk:medium` `depends:[S01]`
  > After this: a user can start SHIP from the bottom composer once every task verification passes.

## Boundary Map

### M011 -> S01

Produces:
  EXECUTE composer state -> bottom handoff control after accepted PLAN

Consumes:
  verify readiness -> same task evidence gate as the visible `Start verify` button

### S01 -> S02

Produces:
  VERIFY composer state -> bottom handoff control after task evidence review starts

Consumes:
  ship readiness -> same all-passed verification gate as the visible `Start ship` button
