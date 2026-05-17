# M002: Execution Lifecycle

**Status:** Started

## Project Description

Extend the database-backed Plan Builder beyond approved planning into the rest of the visible lifecycle. M001 proved `DISCUSS`, `RESEARCH`, `PLAN`, generated projections, and restart persistence. M002 starts the `EXECUTE` path by turning an accepted plan into a persisted task queue that can later launch or link normal execution sessions.

## User-Visible Outcome

When this milestone is complete, a user can move from an accepted plan into execution, see the planned work as a queue, start or link task sessions, track execution status, verify results, and move toward ship readiness without losing the database-backed planning history.

## Scope

### In Scope

- Persisted lifecycle phase transition from `PLAN` to `EXECUTE`.
- Execution queue rendered from the accepted plan hierarchy.
- Future task session linking and task status changes as append-only events.
- Later `VERIFY` and `SHIP` gates that consume execution evidence.

### Out of Scope

- Autonomous task execution in the first slice.
- Git or release automation.
- Replacing the normal session/thread execution surface.

## Decisions

- Plan Builder owns lifecycle phase and queue visibility.
- Normal sessions remain the execution surface for task work.
- Accepted PLAN output remains the source used to seed the first execution queue.
