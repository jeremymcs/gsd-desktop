# M004: Workflow Guidance and Runtime Preferences

**Vision:** Users can move through the GSD workflow with visible, durable workflow defaults and runtime decisions managed by Plan Builder instead of hidden prompt state or hand-edited Markdown.

**Success Criteria:**

- Workflow preferences are persisted as append-only planning events.
- Users can see when recommended defaults have been captured.
- Preference and runtime decision files are projections from `.gsd/gsd.db`.
- Restarted Plan Builder restores captured preferences.
- Later workflow guidance can build on the same database-backed preference model.

---

## Slices

- [x] **S01: Workflow Preferences Bootstrap** `risk:medium` `depends:[M003]`
  > After this: users can apply recommended workflow defaults, see the saved state, and get `.gsd/PREFERENCES.md` plus `.gsd/runtime/research-decision.json` generated from the planning database.

- [x] **S02: Prompt-Guided Stage Framing** `risk:medium` `depends:[S01]`
  > After this: DISCUSS, RESEARCH, PLAN, EXECUTE, VERIFY, and SHIP screens expose the next useful prompt-framed action without relying on hidden agent instructions.

- [ ] **S03: Preference Change Control** `risk:high` `depends:[S01]`
  > After this: users can modify workflow preferences later through append-only events with clear impact on generated runtime files.

## Boundary Map

### M003 -> S01

Produces:
  change-controlled planning state -> stable plan identity for workflow settings
  projection writer ownership -> database-owned Markdown output

Consumes:
  workflow preference bootstrap -> durable defaults and runtime decision projection

### S01 -> S02

Produces:
  captured workflow defaults -> prompt-aligned state visible to the UI

Consumes:
  stage framing UI -> user-facing guidance for each workflow phase

### S01 -> S03

Produces:
  workflow preference record -> baseline for future preference edits

Consumes:
  preference change control -> append-only modifications with projection updates
