# S02: Task Session Linking

**Goal:** Let each EXECUTE task create and reopen a normal desktop session while preserving the task identity in the planning database.

## Tasks

- [x] **T01: Task link event**
  Add an append-only planning event for task-to-session links and replay it into plan snapshots.

- [x] **T02: Session creation bridge**
  Wire a narrow desktop action that creates a normal session, records the task link, and keeps the user in the execution queue.

- [x] **T03: Queue link controls**
  Show linked-session state for each task, plus explicit create and open controls.

- [x] **T04: Restart and open coverage**
  Extend Plan Builder coverage to create a task session, open it, and verify the link after restart.

## Acceptance

- Linking a task creates an ordinary desktop session.
- The link is persisted as a planning database event, not derived from Markdown.
- The execution queue shows linked session state after the link is created.
- Opening a linked task session selects the linked normal session.
- Restart preserves the task-session link.
