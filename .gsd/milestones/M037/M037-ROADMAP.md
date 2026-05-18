# M037: Plan Health Dashboard

**Vision:** Make plan health scannable across a workspace.

**Success Criteria:**

- Dashboard rows include attention counts.
- Health signals come from database state and projection drift.
- Selecting a row still opens the plan without losing context.

---

## Slices

- [ ] **S01: Dashboard Health Signals** `risk:medium` `depends:[M032,M034]`
  > After this: the project dashboard shows which plans need intervention.
