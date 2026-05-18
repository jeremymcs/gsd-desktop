# M043: Run Queue Autopilot

**Vision:** Turn the queue and guardrail checks into a clear autopilot launch surface.

**Success Criteria:**

- Users see what autopilot will do before starting.
- Autopilot follows the same ready-task ordering as the queue.
- Blocking guardrails are visible and stop the autopilot action.

---

## Slices

- [x] **S01: Autopilot Preflight Action** `risk:medium` `depends:[M042]`
  > After this: EXECUTE can launch or open the next safe queued task from a dedicated autopilot preflight.

## Status

- S01 complete: EXECUTE now shows an autopilot preflight that follows next-work ordering and blocks on active guardrails.
