# M003: Plan Change Control

**Vision:** Users can change plans deliberately after initial planning by parking uncertain ideas, reviewing impact, and promoting approved changes without losing audit history.

**Success Criteria:**

- Parked ideas are first-class planning database records and survive restart.
- Parked ideas are visible outside the active discussion memory.
- Future injected changes can reference a source parked item.
- Active accepted task identity is not mutated silently.
- Generated Markdown remains a projection from database state.

---

## Slices

- [x] **S01: First-Class Idea Pool** `risk:medium` `depends:[M002]`
  > After this: clicking `Park` records a durable idea-pool item linked to the source answer and shows it in the Plan Builder outline.

- [x] **S02: Idea Review Actions** `risk:medium` `depends:[S01]`
  > After this: parked ideas can be explicitly kept, dismissed, or prepared for promotion without changing the active plan.

- [x] **S03: Draft Change Proposal** `risk:high` `depends:[S02]`
  > After this: a parked idea can seed a draft change proposal with impact notes before it enters the active plan.

- [x] **S04: Approved Injection** `risk:high` `depends:[S03]`
  > After this: approved changes can add or modify plan structure while preserving original IDs and history.

- [x] **S05: Removal and Hidden State** `risk:high` `depends:[S04]`
  > After this: deleted or removed items are hidden from active projections by append-only events instead of destructive edits.

- [x] **S06: Approved Modification** `risk:high` `depends:[S04]`
  > After this: approved changes can modify an active task through a new accepted roadmap output without mutating prior history.

## Boundary Map

### M002 -> S01

Produces:
  completed lifecycle state -> durable plan identity through SHIP
  discussion answer events -> source context for parked work

Consumes:
  idea pool -> parked records linked to source answer metadata

### S01 -> S02

Produces:
  parked item identity -> stable source for later review actions

Consumes:
  idea review UI -> explicit keep/dismiss/promote intent

### S02 -> S03

Produces:
  reviewed parked item status -> stable source for draft change proposals

Consumes:
  draft proposal form -> impact notes before active plan mutation

### S03 -> S04

Produces:
  draft change proposal -> auditable candidate for approved injection

Consumes:
  approval gate -> append-only plan structure changes that preserve original IDs

### S04 -> S05

Produces:
  approved injection history -> active plan changes through a new accepted roadmap output
  original accepted task identity -> unchanged historical IDs for prior plan structure

Consumes:
  removal and hidden-state controls -> append-only events that hide active items without destructive deletion

### S04 -> S06

Produces:
  draft change proposal -> impact-reviewed source for active task modifications
  accepted task identity -> stable task path preserved through title, acceptance, and dependency changes

Consumes:
  approved modification controls -> append-only events and a new accepted roadmap output for changed task details
