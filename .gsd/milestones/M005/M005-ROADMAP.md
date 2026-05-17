# M005: Prompt Corpus Parity and Adaptive Questioning

**Vision:** Plan Builder exposes the same durable planning concepts required by the GSD prompt corpus while keeping the UI deterministic, restart-safe, and database-backed.

**Success Criteria:**

- Project Shape is captured in DISCUSS and projected into `.gsd/PROJECT.md`.
- Requirements work can be reviewed as a capability contract instead of only loose discussion memory.
- Prompt-backed workflow concepts are visible in the UI without making raw Markdown prompts the runtime source of truth.
- New prompt-parity fields remain covered by Electron tests on the real desktop surface.

---

## Slices

- [x] **S01: Project Shape Capture** `risk:low` `depends:[M004]`
  > After this: the DISCUSS wizard asks whether the project is simple or complex, saves the answer to project state, and generated `PROJECT.md` contains the classified Project Shape.

- [ ] **S02: Requirements Contract Review** `risk:high` `depends:[S01]`
  > After this: requirements-stage answers can be reviewed as explicit capability contract rows with class, status, owner, source, and validation state before PLAN.

- [ ] **S03: Prompt Source Framing** `risk:medium` `depends:[S01]`
  > After this: workflow guidance can identify which GSD prompt family is shaping the current phase, so users understand why the wizard is asking a given question.

- [ ] **S04: Adaptive Follow-Up Drafting** `risk:high` `depends:[S02,S03]`
  > After this: Plan Builder can suggest a focused follow-up question when answers are vague, while still saving only explicit user responses as canonical state.

## Boundary Map

### M004 -> S01

Produces:
  discussion memory and prompt context -> existing durable answer records with original question text
  theme-safe Plan Builder surfaces -> stable UI baseline for another DISCUSS field

Consumes:
  project shape capture -> typed `ProjectSummary.shape` populated from a DISCUSS answer

### S01 -> S02

Produces:
  project shape -> simple/complex cadence signal for requirements review
  updated PROJECT projection -> downstream requirements prompt can read actual complexity instead of defaulting

Consumes:
  requirements contract review -> first-class requirement records mapped from requirements discussion

### S01 -> S03

Produces:
  prompt parity pattern -> UI question maps to an upstream GSD prompt concept without importing prompt Markdown at runtime

Consumes:
  prompt source framing -> visible phase/source metadata for workflow guidance

### S02 + S03 -> S04

Produces:
  explicit requirements and prompt source metadata -> context needed to detect vague or incomplete answers

Consumes:
  adaptive follow-up drafting -> suggested follow-ups that remain non-canonical until the user answers
