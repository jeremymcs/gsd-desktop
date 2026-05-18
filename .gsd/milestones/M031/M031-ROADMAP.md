# M031: Projection/Database Drift Repair

**Vision:** Keep generated files aligned with the planning database without unsafe overwrites.

**Success Criteria:**

- Drift detection distinguishes generated files from legacy files.
- Repair rewrites generated projections and reports conflicts.
- Electron tests cover missing, stale, and legacy-conflict cases.

---

## Slices

- [ ] **S01: Projection Drift Status** `risk:high` `depends:[M030]`
  > After this: Plan Builder can report and repair generated projection drift.

