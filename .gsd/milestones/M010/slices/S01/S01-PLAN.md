# S01: Composer Question Context

**Goal:** Keep the active DISCUSS question visible inside the composer even after the user starts typing.

## Tasks

- [x] Render active question text above the composer textarea.
- [x] Keep the textarea bound to the existing answer draft.
- [x] Preserve the status-only composer state when no question is active.
- [x] Add Electron coverage for question context remaining visible while typing.

## Acceptance

- The composer shows the active question before and after typing.
- Submitting from the composer still advances to the next question.
- The composer question text updates to the next active prompt.
