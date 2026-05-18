# M018: Restore Hidden Injected Tasks

**Vision:** Make injected-task removal reversible while keeping the database event log canonical.

**Success Criteria:**

- Restore has its own append-only event.
- The UI exposes restore only for approved injected tasks that are hidden from the accepted PLAN.
- Projection regeneration reflects hide, restore, and hide-again transitions.

---

## Slices

- [x] **S01: Restore Approved Injected Task** `risk:medium` `depends:[M016,M017]`
  > After this: a hidden injected task can be restored from its proposal card and replayed from the database.

## Boundary Map

### Existing hide flow -> S01

Produces:
  hidden plan item record -> active-plan removal plus projection rewrite

Consumes:
  approved injection record -> source of truth for task title, acceptance, dependencies, and target slice
