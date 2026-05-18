# M023: Change Proposal Activity History

**Vision:** Make append-only change-control history visible and understandable.

**Success Criteria:**

- Proposal cards show their lifecycle history.
- Activity entries replay from events.
- History covers proposal updates, deletion, approval, hide, restore, and modification.

---

## Slices

- [ ] **S01: Proposal Activity Projection** `risk:medium` `depends:[M020,M022]`
  > After this: planning snapshots expose proposal activity derived from the event stream.

- [ ] **S02: Proposal Card Timeline** `risk:medium` `depends:[S01]`
  > After this: users can expand a proposal card and see its lifecycle activity in order.

- [ ] **S03: Change Log Projection** `risk:low` `depends:[S01,S02]`
  > After this: generated Markdown includes a compact change log for accepted and withdrawn proposal history.

## Boundary Map

### Existing event stream -> S01

Produces:
  plan events -> durable proposal lifecycle facts

Consumes:
  activity projection -> per-proposal event summaries in snapshot state

### S01 -> S02

Produces:
  activity summaries -> user-readable proposal history

Consumes:
  card timeline -> expandable history beside proposal actions

### S02 -> S03

Produces:
  stable activity labels -> projection-ready change log entries

Consumes:
  Markdown change log -> reviewable project history without database inspection
