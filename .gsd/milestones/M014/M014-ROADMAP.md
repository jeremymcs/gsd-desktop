# M014: Composer-Driven Idea Capture

**Vision:** The Plan Builder composer should let users park later-phase notes and change requests into the existing idea pool without mutating the active plan.

**Success Criteria:**

- A direct database-backed park-idea action exists for composer notes.
- The action appends an idea event without adding an answer record.
- The composer can park notes after DISCUSS while preserving phase state.
- Electron tests cover persistence through the visible UI.

---

## Slices

- [x] **S01: Direct Park-Idea Action** `risk:medium` `depends:[M013]`
  > After this: the desktop planning API can append a composer-origin parked idea without recording a synthetic answer.

- [ ] **S02: Later-Phase Composer Parking** `risk:medium` `depends:[S01]`
  > After this: a user can type a later-phase note in the Plan Builder composer and park it into the idea pool.

## Boundary Map

### M013 -> S01

Produces:
  composer closeout and phase-aware input handling -> bottom composer can own more than DISCUSS answers

Consumes:
  direct parked idea event -> later notes enter the idea pool without corrupting discussion memory

### S01 -> S02

Produces:
  database-backed park-idea action -> safe renderer/preload/main path for composer notes

Consumes:
  later-phase composer parking -> visible workflow for parking change requests during RESEARCH, PLAN, EXECUTE, VERIFY, and SHIP
