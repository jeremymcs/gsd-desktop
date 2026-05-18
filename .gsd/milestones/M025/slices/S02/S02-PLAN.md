# S02: Phase Model Handoff

**Goal:** Carry the effective EXECUTE phase model into task execution.

## Tasks

- [x] Resolve project EXECUTE override before global fallback.
- [x] Include resolved model metadata in the task handoff state.
- [x] Keep UI labels provider-neutral.
- [x] Cover global and project override cases.

## Acceptance

- Project override wins when set.
- Global default is used when no project override exists.
- The execution handoff can inspect the effective model without guessing.
