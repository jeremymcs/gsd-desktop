# M035: Resume From Recovery Target

**Vision:** Turn recovery summaries into one-click resume actions.

**Success Criteria:**

- Users can resume from the recorded recovery target.
- Existing linked sessions open instead of duplicating task sessions.
- Electron coverage proves the action survives restart.

---

## Slices

- [x] **S01: Recovery Resume Action** `risk:medium` `depends:[M034]`
  > After this: the recovery summary can restart the safest task directly.
