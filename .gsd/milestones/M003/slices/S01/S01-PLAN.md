# S01: First-Class Idea Pool

**Goal:** Make parked discussion notes durable planning records with source metadata and a visible outline panel.

## Tasks

- [x] **T01: Parked item event model**
  Add append-only parked item records to the planning database replay model.

- [x] **T02: Park action bridge**
  When a DISCUSS answer is parked, record both the non-load-bearing answer and a first-class parked item linked to it.

- [x] **T03: Outline idea pool**
  Show parked items separately from load-bearing discussion memory in the Plan Builder outline.

- [x] **T04: Restart coverage**
  Extend the Plan Builder Electron spec to park an idea, continue answering the active question, and prove the idea survives restart.

## Acceptance

- `Park` does not answer or advance the active load-bearing question.
- Parked items are persisted as database events.
- Parked items include source answer, source stage, source question, prompt, text, and rationale.
- Discussion memory shows load-bearing answers, while parked items appear in the idea pool.
- Restart preserves the idea pool.
