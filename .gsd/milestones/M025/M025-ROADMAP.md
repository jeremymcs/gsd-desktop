# M025: Execution Handoff Context

**Vision:** Turn accepted PLAN tasks into well-scoped execution sessions with durable evidence links.

**Success Criteria:**

- Task sessions receive a generated execution brief.
- Handoff context includes requirements and verification expectations.
- Evidence links back to the Plan Builder task queue.

---

## Slices

- [ ] **S01: Task Execution Brief** `risk:high` `depends:[M024]`
  > After this: opening a task session creates a concise execution brief from accepted plan state and linked requirements.

- [ ] **S02: Phase Model Handoff** `risk:medium` `depends:[S01]`
  > After this: task execution handoff can resolve the effective EXECUTE phase model from project override or global default.

- [ ] **S03: Evidence Back-Link** `risk:medium` `depends:[S01,S02]`
  > After this: execution evidence and session links are visible on the task queue after restart.

## Boundary Map

### Accepted plan + requirements -> S01

Produces:
  task details, dependencies, and coverage -> execution context

Consumes:
  execution brief -> session-ready handoff text

### S01 -> S02

Produces:
  task session launch path -> place to attach runtime preference

Consumes:
  effective phase model -> model choice resolved from project and global settings

### S02 -> S03

Produces:
  linked task session -> durable task/session identity

Consumes:
  evidence back-link -> queue state that explains what was run and proven
