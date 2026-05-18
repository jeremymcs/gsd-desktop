# M017: Idea Pool Proposal Review Handoff

**Vision:** Keep proposal review reachable from every place a drafted parked idea is visible.

**Success Criteria:**

- Idea pool drafted proposals are actionable.
- Review still routes to the existing proposal form.
- Composer and side-pane proposal handoffs behave consistently.

---

## Slices

- [x] **S01: Side-Pane Proposal Review Action** `risk:low` `depends:[M016]`
  > After this: a drafted idea pool item exposes Review proposal and focuses the existing proposal approval form.

## Boundary Map

### M016 -> S01

Produces:
  proposal focus request -> existing mechanism for centering and focusing proposal forms

Consumes:
  idea pool action row -> side-pane action that reuses proposal focus instead of a disabled drafted label
