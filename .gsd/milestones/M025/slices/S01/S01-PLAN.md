# S01: Task Execution Brief

**Goal:** Generate useful context when opening a task session.

## Tasks

- [x] Build a deterministic execution brief from accepted plan task state.
- [x] Include acceptance criteria, dependencies, linked requirements, and relevant research.
- [x] Attach the brief to new task sessions through the existing session path.
- [x] Cover generated brief content without real provider calls.

## Acceptance

- Opening a task session gives the user enough context to execute the task.
- The brief is deterministic and restart-safe.
- Existing linked-session behavior still works.
