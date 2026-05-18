# M019: Delete Draft Change Proposals

**Vision:** Let users discard bad proposal drafts without mutating planning history.

**Success Criteria:**

- Draft proposal deletion is append-only.
- Deleted drafts no longer block replacement drafts for the same idea.
- Restart restores deleted draft history and the active replacement draft.

---

## Slices

- [x] **S01: Withdraw Draft Proposal** `risk:medium` `depends:[M017,M018]`
  > After this: a draft proposal can be deleted, shown as deleted history, and replaced with a new draft from the same parked idea.

## Boundary Map

### M017/M018 -> S01

Produces:
  proposal review card -> existing surface where draft approval choices live

Consumes:
  draft withdrawal -> non-destructive way to delete an unapproved proposal and reopen the idea for a replacement draft
