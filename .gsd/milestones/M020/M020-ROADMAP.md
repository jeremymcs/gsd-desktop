# M020: Edit Draft Change Proposals

**Vision:** Let users refine proposal drafts before approval without rewriting planning history.

**Success Criteria:**

- Draft proposal details are editable through the UI.
- Draft detail edits are append-only and replayable.
- Restart restores the revised draft details.

---

## Slices

- [x] **S01: Update Draft Proposal Details** `risk:medium` `depends:[M017,M019]`
  > After this: a draft proposal can have its title, summary, and impact notes corrected before approval, and the revised draft persists across restart.

## Boundary Map

### M017/M019 -> S01

Produces:
  proposal review card -> existing surface where draft approval and deletion choices live

Consumes:
  draft detail update -> non-destructive way to refine an unapproved proposal without deleting and redrafting
