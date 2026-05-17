# M002: Execution Lifecycle

**Vision:** Users can continue from an accepted plan into an execution queue, then later run, verify, and ship work through explicit lifecycle gates.

**Success Criteria:**

- Starting execution is persisted in the planning database and survives restart.
- The execution surface shows accepted milestones, slices, and tasks without treating Markdown as source.
- Future task execution can link to normal desktop sessions rather than bypassing the session runtime.
- Verification and shipping stay blocked until execution evidence exists.

---

## Slices

- [x] **S01: EXECUTE Queue Activation** `risk:medium` `depends:[M001/S06,M001/S07]`
  > After this: a user can start `EXECUTE` from an accepted PLAN, see the task queue from the accepted hierarchy, and restart into the active execution view.

- [x] **S02: Task Session Linking** `risk:high` `depends:[S01]`
  > After this: each execution task can launch or link a normal desktop session while preserving task identity in planning state.

- [ ] **S03: Task Status and Evidence Capture** `risk:high` `depends:[S02]`
  > After this: task progress, blockers, and evidence can be persisted as append-only events and shown in the queue.

- [ ] **S04: VERIFY Gate** `risk:high` `depends:[S03]`
  > After this: completed tasks can be checked against acceptance criteria before the plan advances.

- [ ] **S05: SHIP Gate** `risk:medium` `depends:[S04]`
  > After this: verified work can be summarized for final handoff or release readiness.

## Boundary Map

### M001 -> S01

Produces:
  accepted PLAN output -> milestone/slice/task hierarchy
  projection regeneration -> generated Markdown file set
  planning store -> append-only event history and active phase state

Consumes:
  execution queue UI -> accepted plan proposal
  phase transition event -> active `EXECUTE` lifecycle state

### S01 -> S02

Produces:
  execution queue item identity -> task IDs and current active lifecycle phase

Consumes:
  session runtime -> linked task sessions

### S02 -> S03

Produces:
  task session links -> persisted task identity plus workspace/session targets
  execution queue controls -> explicit create/open session actions

Consumes:
  task evidence model -> status, blockers, and verification artifacts tied back to task identity
