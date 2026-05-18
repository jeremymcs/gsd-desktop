# M022: Edit Parked Ideas

**Vision:** Let users refine parked ideas before they become formal plan changes.

**Success Criteria:**

- Parked idea edits are append-only and replayable.
- Dismissed ideas can be restored.
- Change drafts use the latest parked idea text.

---

## Slices

- [x] **S01: Update Parked Idea Text** `risk:medium` `depends:[M021]`
  > After this: a parked idea can be edited in the idea pool and the revised text survives restart.

- [x] **S02: Restore Dismissed Ideas** `risk:medium` `depends:[S01]`
  > After this: a dismissed parked idea can be restored to parked status and prepared for promotion again.

- [x] **S03: Draft From Latest Idea Text** `risk:low` `depends:[S01,S02]`
  > After this: change drafts seeded from parked ideas always use the latest edited idea text.

## Boundary Map

### Existing idea pool -> S01

Produces:
  parked item records -> source prompt, review status, and current text

Consumes:
  idea update event -> append-only refinement before promotion

### S01 -> S02

Produces:
  editable parked item lifecycle -> preserved dismissed history

Consumes:
  restore action -> reversible review status without event deletion

### S01/S02 -> S03

Produces:
  latest parked idea text -> refined source material

Consumes:
  draft seeding -> proposal title, summary, and impact can start from current idea state
