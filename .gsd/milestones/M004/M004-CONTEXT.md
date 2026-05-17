# M004: Workflow Guidance and Runtime Preferences

**Status:** Active

## Project Description

Bring the existing GSD workflow guidance into the Plan Builder UI as durable, database-backed state. Markdown and runtime files remain projections from the planning database, not a second source of truth.

M001 proved durable planning memory and projections. M002 proved execution through SHIP. M003 proved change control for real plans that evolve. M004 aligns the UI with the prompt-backed GSD workflow defaults and starts making runtime decisions explicit.

## User-Visible Outcome

Users can start a new project with the recommended workflow defaults already captured, visible, and restart-safe before they move deeper into DISCUSS, RESEARCH, PLAN, EXECUTE, VERIFY, and SHIP.

## Scope

### In Scope

- Database-backed workflow preference records.
- UI affordance for applying the recommended defaults.
- Generated `.gsd/PREFERENCES.md` from database state.
- Generated `.gsd/runtime/research-decision.json` from database state.
- Restart persistence and Electron coverage.

### Out of Scope

- Multi-option workflow preference editing.
- Two-way sync from generated preference Markdown.
- Autonomous runtime execution changes beyond writing the decision file.

## Decisions

- Recommended defaults are an explicit planning event, not an implicit UI assumption.
- Prompt-aligned workflow settings are projected from the database.
- Runtime decision files are written as machine-readable projections.
- The first workflow preference slice uses deterministic defaults before adding broader editing controls.
