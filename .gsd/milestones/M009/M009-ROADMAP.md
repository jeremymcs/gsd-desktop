# M009: Composer-Driven Plan Questioning

**Vision:** Users can drive DISCUSS through the bottom Plan Builder composer, making the wizard feel like a guided Codex-style planning conversation instead of a form-only workflow.

**Success Criteria:**

- The composer can save the active DISCUSS answer.
- The composer can park the active DISCUSS draft.
- Composer actions remain backed by the same database events as card actions.
- Restart coverage proves composer-submitted planning state persists.

---

## Slices

- [x] **S01: Composer Answer Submit** `risk:medium` `depends:[M008]`
  > After this: a user can type the active DISCUSS answer in the bottom composer and submit it as a load-bearing answer.

- [x] **S02: Composer Park Action** `risk:medium` `depends:[S01]`
  > After this: a user can park the composer draft without advancing the active load-bearing question.

- [x] **S03: Composer Persistence Coverage** `risk:medium` `depends:[S01,S02]`
  > After this: Electron tests prove composer-submitted answers and parked notes persist across restart without synthetic records.

## Boundary Map

### M008 -> S01

Produces:
  active DISCUSS question state -> current prompt and answer draft

Consumes:
  composer submit -> load-bearing answer event through the existing `recordAnswer` path

### S01 -> S02

Produces:
  composer draft input -> shared state with active question card

Consumes:
  composer park action -> non-load-bearing parked item event through the existing `recordAnswer(false)` path

### S01 + S02 -> S03

Produces:
  composer-driven answer and park events -> database-backed planning state

Consumes:
  restart coverage -> assertions that saved answer memory and idea pool restore correctly
