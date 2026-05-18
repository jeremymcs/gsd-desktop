# M028: Autonomous Slice Run Policy

**Vision:** Make overnight execution rules explicit and durable.

**Success Criteria:**

- Users can see and persist autonomous run policy.
- The policy defines stop conditions, commit cadence, and verification expectations.
- `.gsd/NEXT.md` includes the active policy.

---

## Slices

- [ ] **S01: Persist Run Policy Defaults** `risk:medium` `depends:[M027]`
  > After this: plans have durable autonomous-run policy defaults available to UI and projections.

## Boundary Map

### Workflow preferences -> S01

Produces:
  durable run policy -> execution guardrails

Consumes:
  projection renderer -> handoff-ready policy summary

