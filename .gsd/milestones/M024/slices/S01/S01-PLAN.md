# S01: Requirement References In PLAN

**Goal:** Let accepted plan structure reference requirements.

## Tasks

- [x] Extend plan proposal task or slice records with requirement references.
- [x] Add UI controls for requirement ID selection or entry.
- [x] Persist accepted references in plan output events.
- [x] Cover replay and restart behavior.

## Acceptance

- A plan item can reference one or more requirement IDs.
- Accepted plan output restores those references.
- Existing plans without references remain valid.
