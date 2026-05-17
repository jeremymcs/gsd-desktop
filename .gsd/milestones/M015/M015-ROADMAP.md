# M015: Composer-Driven Idea Review

**Vision:** The Plan Builder composer should hand newly parked notes into explicit review actions instead of leaving users to hunt through the idea pool.

**Success Criteria:**

- A newly parked composer idea gets a visible composer-level review prompt.
- The review prompt can Keep, Prepare, or Dismiss using the existing persisted review event.
- Empty-composer phase handoffs and SHIP summary behavior remain unchanged.
- Electron tests cover the visible review handoff and persistence.

---

## Slices

- [x] **S01: Composer Parked-Idea Review Handoff** `risk:medium` `depends:[M014]`
  > After this: a user can park a later-phase note and immediately review it from the composer without leaving the workflow surface.

- [x] **S02: Composer Change-Draft Handoff** `risk:medium` `depends:[S01]`
  > After this: a prepared composer idea can open the existing change-draft form directly from the composer follow-up.

## Boundary Map

### M014 -> S01

Produces:
  composer-origin parked ideas -> database-backed notes with source phase and source prompt

Consumes:
  composer review handoff -> immediate Keep, Prepare, or Dismiss action against the parked note

### S01 -> S02

Produces:
  prepared composer idea -> promoted note that is ready for change-control

Consumes:
  composer change-draft handoff -> opens the existing draft form without replacing the current change-control workflow
