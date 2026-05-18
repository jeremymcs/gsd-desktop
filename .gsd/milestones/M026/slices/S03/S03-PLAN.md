# S03: Handoff Projection

**Goal:** Generate a durable next-action handoff file.

## Tasks

- [x] Add `.gsd/NEXT.md` projection from queue state.
- [x] Include active plan, next tasks, blockers, evidence gaps, and verification gates.
- [x] Write atomically and only when content changes.
- [x] Cover projection output in tests.

## Acceptance

- `.gsd/NEXT.md` can guide a new session to the next work.
- The file matches the UI queue state.
- Regeneration is stable when queue state has not changed.
