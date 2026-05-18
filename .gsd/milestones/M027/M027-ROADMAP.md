# M027: Start Next Work From Queue

**Vision:** Turn the next-work queue into a one-click execution driver.

**Success Criteria:**

- Users can start or open the first ready task from the queue header.
- The action follows the same deterministic ordering as the queue.
- Restart does not change the selected next task.

---

## Slices

- [ ] **S01: Primary Queue Start Action** `risk:medium` `depends:[M026]`
  > After this: the Plan Builder next-work panel can start or open the first ready task.

## Boundary Map

### M026 queue -> S01

Produces:
  ready queue item -> primary task-session action

Consumes:
  linked session state -> open existing or create new session

