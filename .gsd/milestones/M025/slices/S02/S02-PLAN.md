# S02: Phase Model Handoff

**Goal:** Carry the effective EXECUTE phase model into task execution.

## Tasks

- [ ] Resolve project EXECUTE override before global fallback.
- [ ] Include resolved model metadata in the task handoff state.
- [ ] Keep UI labels provider-neutral.
- [ ] Cover global and project override cases.

## Acceptance

- Project override wins when set.
- Global default is used when no project override exists.
- The execution handoff can inspect the effective model without guessing.
