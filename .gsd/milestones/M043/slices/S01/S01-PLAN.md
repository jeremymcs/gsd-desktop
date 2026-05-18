# S01: Autopilot Preflight Action

**Goal:** Add a dedicated autopilot launch surface that uses queue order and guardrail state.

## Tasks

- [ ] Derive the first ready queue item and blocking guardrail state in EXECUTE.
- [ ] Render an autopilot preflight card before the queue.
- [ ] Start or open the first ready task session from the preflight action.
- [ ] Cover the preflight in Electron tests.

## Acceptance

- A user can see the next autopilot task, launch it, and verify it uses the same task session behavior as the queue.
