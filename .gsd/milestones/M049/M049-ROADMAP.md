# M049: Projection Health Repair Actions

**Vision:** Turn projection health from passive status into deterministic repair.

**Success Criteria:**

- Drift repair and legacy overwrite actions are distinct.
- Repair updates generated files and UI state.
- Tests cover conflict and non-conflict repair paths.

---

## Slices

- [ ] **S01: Projection Repair Controls** `risk:medium` `depends:[M031,M042]`
  > After this: users can repair projection health from the warning or projection surfaces.
