# M007: Plan Readiness Gates

**Vision:** Plan Builder should make weak planning context visible at phase handoffs, so users move from DISCUSSION to RESEARCH, PLAN, EXECUTE, VERIFY, and SHIP intentionally.

**Success Criteria:**

- DISCUSS completion warns when unresolved guidance remains.
- Handoff gates reuse derived follow-up state instead of writing new persistence records.
- Users can still move forward in early slices while seeing the readiness risk.
- Electron tests cover each user-visible gate behavior.

---

## Slices

- [x] **S01: DISCUSS Readiness Warning** `risk:low` `depends:[M006/S04]`
  > After this: the DISCUSS complete card shows unresolved guidance before Start research, while keeping Start research available.

- [x] **S02: Explicit Research Override** `risk:medium` `depends:[S01]`
  > After this: high-signal unresolved guidance requires an explicit "continue anyway" acknowledgement before starting RESEARCH.

- [x] **S03: PLAN Readiness Warning** `risk:medium` `depends:[S01]`
  > After this: accepted RESEARCH can surface unresolved DISCUSS guidance again before Start plan.

- [ ] **S04: Readiness Gate Persistence Semantics** `risk:medium` `depends:[S02,S03]`
  > After this: readiness decisions remain derived or explicit user actions, with tests proving guidance prompts are never stored as answers.

## Boundary Map

### M006/S04 -> S01

Produces:
  unresolved guidance rollup -> stage-grouped derived follow-up state

Consumes:
  DISCUSS readiness warning -> user-facing handoff warning before RESEARCH

### S01 -> S02

Produces:
  handoff warning surface -> place for stricter high-signal acknowledgement

Consumes:
  explicit override -> user-owned decision to proceed with unresolved guidance

### S01 -> S03

Produces:
  reusable readiness gate UI -> same derived state can appear at PLAN handoff

Consumes:
  PLAN readiness warning -> accepted research does not hide unresolved DISCUSS risk

### S02 + S03 -> S04

Produces:
  override intent and readiness warnings -> behavior that must stay non-synthetic

Consumes:
  persistence semantics tests -> no hidden guidance answers or non-user mutations
