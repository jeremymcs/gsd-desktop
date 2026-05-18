# M026: Next Work Queue

**Vision:** Give overnight work a clear next-action queue derived from the active plan state.

**Success Criteria:**

- Next work is computed from dependencies and status.
- The UI exposes unblocked work without hiding blocked context.
- A projection file can be used as a durable handoff.

---

## Slices

- [x] **S01: Compute Next Work Items** `risk:high` `depends:[M025]`
  > After this: planning state can identify unblocked task items from accepted plan structure and execution status.

- [x] **S02: Next Work Panel** `risk:medium` `depends:[S01]`
  > After this: Plan Builder shows the next actionable items with dependency and evidence context.

- [ ] **S03: Handoff Projection** `risk:medium` `depends:[S01,S02]`
  > After this: generated `.gsd/NEXT.md` summarizes the active queue for another session or agent.

## Boundary Map

### Accepted plan + execution state -> S01

Produces:
  task graph, statuses, and evidence -> schedulable work facts

Consumes:
  next work computation -> unblocked queue entries

### S01 -> S02

Produces:
  next work entries -> UI-ready queue data

Consumes:
  next work panel -> visible overnight work driver

### S02 -> S03

Produces:
  queue summary -> durable handoff data

Consumes:
  `.gsd/NEXT.md` projection -> file-based next-action list
