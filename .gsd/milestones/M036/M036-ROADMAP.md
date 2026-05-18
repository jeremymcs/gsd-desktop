# M036: Autonomous Run Activity Ledger

**Vision:** Make long-run history inspectable, not only resumable.

**Success Criteria:**

- Attempts, stops, and resumes are durable.
- UI and projection agree on latest run activity.
- Tests cover restart and projection output.

---

## Slices

- [x] **S01: Run Activity Events** `risk:high` `depends:[M035]`
  > After this: users can inspect the recent autonomous run trail.
