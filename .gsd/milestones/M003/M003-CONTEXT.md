# M003: Plan Change Control

**Status:** Complete

## Project Description

Extend the database-backed Plan Builder so users can park, inject, change, modify, add, and delete planning work without losing history or corrupting the accepted execution queue.

M001 proved durable DISCUSS, RESEARCH, PLAN, and projections. M002 proved the execution lifecycle through SHIP. M003 adds the change-control layer needed for real projects that evolve after the first accepted plan.

## User-Visible Outcome

When this milestone is complete, users can keep uncertain ideas out of active plans, review them later, and promote approved changes through impact-aware gates rather than editing generated Markdown or mutating active task identity directly.

## Scope

### In Scope

- First-class parked work records in the planning database.
- Visible idea pool in the Plan Builder outline.
- Later promotion/injection workflow from parked ideas into draft plan changes.
- Later deletion/removal events that hide records from active projections while preserving audit history.

### Out of Scope

- Autonomous change implementation.
- Git or release automation.
- Two-way Markdown sync.

## Decisions

- Parked work is canonical database state, not prose hidden inside discussion answers.
- Active accepted plan identity remains stable until a later approved change event replaces or extends it.
- Generated Markdown remains a projection and should not become an edit source.
