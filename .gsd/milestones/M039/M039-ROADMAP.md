# M039: Handoff Bundle Export

**Vision:** Package the active plan state into a concise handoff artifact.

**Success Criteria:**

- Handoff content is deterministic.
- It includes next work, run policy, recovery, and projection status.
- Electron coverage verifies the handoff text.

---

## Slices

- [x] **S01: Active Plan Handoff Text** `risk:medium` `depends:[M034]`
  > After this: users can copy a restart-safe handoff summary.
