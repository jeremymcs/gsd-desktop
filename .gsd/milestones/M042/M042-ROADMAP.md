# M042: Guardrail Detection Hooks

**Vision:** Move guardrails from policy text toward actionable run checks.

**Success Criteria:**

- Deterministic guardrail warnings appear before run actions.
- Warnings use local state and avoid model judgment.
- Users can still inspect the policy text.

---

## Slices

- [ ] **S01: Deterministic Guardrail Warnings** `risk:high` `depends:[M029,M031]`
  > After this: Plan Builder warns when known local state violates autonomous-run guardrails.
