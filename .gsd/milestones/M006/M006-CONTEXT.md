# M006: Adaptive Planning Guidance

**Status:** Active

## Project Description

Extend Plan Builder's adaptive questioning from passive follow-up suggestions into a clearer guidance loop. M005 proved prompt-corpus parity and UI-only follow-up drafting. M006 makes those follow-ups more useful without weakening the planning database contract: the UI can explain what looks incomplete, but canonical planning state changes only when the user edits or saves an explicit answer.

## User-Visible Outcome

Users can tell why the wizard is asking for more detail, which missing context matters most, and how to tighten an answer before it shapes research, planning, execution, verification, or shipping.

## Scope

### In Scope

- Deterministic follow-up signals derived from existing DISCUSS answers and question metadata.
- Clear UI treatment for severity, missing context, and revision guidance.
- Follow-up behavior that remains restart-safe because it is recomputed from saved answers.
- Electron coverage proving suggestions are explanatory and not persisted as answers.

### Out of Scope

- Model-generated follow-up questions.
- New database tables for adaptive metadata.
- Auto-mutating user answers.
- Importing generated Markdown as source state.

## Decisions

- Follow-up intelligence remains derived until there is a concrete user action worth persisting.
- The first slice should improve explanation quality without adding new storage risk.
- Persisted answer revision remains the canonical way to resolve a follow-up.
