# M034: Overnight Run Handoff And Recovery

**Vision:** Make overnight execution resumable after success, stop, or failure.

**Success Criteria:**

- Stop reason and last attempted task are durable.
- Resume guidance is visible in UI and generated handoff files.
- Tests cover restart after partial autonomous progress.

---

## Slices

- [x] **S01: Run Recovery Summary** `risk:high` `depends:[M033]`
  > After this: Plan Builder can explain where an overnight run stopped and what resumes next.
