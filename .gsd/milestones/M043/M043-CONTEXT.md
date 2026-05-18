# M043: Run Queue Autopilot

Plan Builder can start the next ready task, but the overnight path still feels like a manual queue. The next step is an explicit autopilot preflight that tells the user what will run next, what will block it, and starts or opens the deterministic next task.

## Success Criteria

- EXECUTE shows an autopilot preflight near the queue.
- The preflight names the next ready task and whether it will create or open a task session.
- Blocking guardrails prevent autopilot start without hiding the normal queue.
- Electron coverage proves the preflight follows deterministic next-work ordering.
