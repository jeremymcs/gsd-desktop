# M004: Workflow Guidance and Runtime Preferences

**Vision:** Users can move through the GSD workflow with visible, durable workflow defaults and runtime decisions managed by Plan Builder instead of hidden prompt state or hand-edited Markdown.

**Success Criteria:**

- Workflow preferences are persisted as append-only planning events.
- Users can see when recommended defaults have been captured.
- Preference and runtime decision files are projections from `.gsd/gsd.db`.
- Restarted Plan Builder restores captured preferences.
- Each workflow phase can carry its own model preference instead of sharing one executor class.
- Later workflow guidance can build on the same database-backed preference model.

---

## Slices

- [x] **S01: Workflow Preferences Bootstrap** `risk:medium` `depends:[M003]`
  > After this: users can apply recommended workflow defaults, see the saved state, and get `.gsd/PREFERENCES.md` plus `.gsd/runtime/research-decision.json` generated from the planning database.

- [x] **S02: Prompt-Guided Stage Framing** `risk:medium` `depends:[S01]`
  > After this: DISCUSS, RESEARCH, PLAN, EXECUTE, VERIFY, and SHIP screens expose the next useful prompt-framed action without relying on hidden agent instructions.

- [x] **S03: Preference and Phase Model Change Control** `risk:high` `depends:[S01,S02]`
  > After this: users can set global phase model defaults in Settings and project-specific phase overrides in Plan Builder, with project overrides persisted through append-only events and reflected in generated preference projections.

- [ ] **S04: Light/Dark Mode Consistency Fix** `risk:medium` `depends:[S03]`
  > After this: Plan Builder and workflow preference controls render cleanly in both light and dark modes, with readable contrast, stable controls, and no theme-specific regressions.

## Boundary Map

### M003 -> S01

Produces:
  change-controlled planning state -> stable plan identity for workflow settings
  projection writer ownership -> database-owned Markdown output

Consumes:
  workflow preference bootstrap -> durable defaults and runtime decision projection
  global phase model defaults -> app-level fallback when a project leaves a phase unset

### S01 -> S02

Produces:
  captured workflow defaults -> prompt-aligned state visible to the UI

Consumes:
  stage framing UI -> user-facing guidance for each workflow phase

### S01 -> S03

Produces:
  workflow preference record -> baseline for future preference edits
  workflow preference defaults -> initial executor-class fallback before per-phase overrides

Consumes:
  preference change control -> append-only modifications with projection updates
  phase model controls -> project overrides for DISCUSS, RESEARCH, PLAN, EXECUTE, VERIFY, and SHIP

### S02 -> S03

Produces:
  stage framing UI -> explicit workflow phases that can own model choices

Consumes:
  phase model controls -> model pickers and persisted preferences scoped to each phase

### S03 -> S04

Produces:
  phase model controls -> new Settings and Plan Builder controls that must behave in both themes

Consumes:
  light/dark mode fix -> theme-safe planning controls and readable workflow surfaces
