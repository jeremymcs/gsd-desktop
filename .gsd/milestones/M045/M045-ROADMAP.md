# M045: Multi-plan Conflict Detection

**Vision:** Keep parallel plans from quietly colliding.

**Success Criteria:**

- Cross-plan conflicts appear in the plan dashboard.
- Signals are deterministic and explainable.
- Conflict state is covered by package or Electron tests.

---

## Slices

- [x] **S01: Dashboard Conflict Signals** `risk:medium` `depends:[M032,M037]`
  > After this: dashboard rows identify local cross-plan conflicts before execution starts.

## Status

- S01 complete: dashboard rows now surface deterministic cross-plan conflicts for active accepted plans sharing the workspace projection surface.
