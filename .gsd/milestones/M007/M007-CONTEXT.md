# M007: Plan Readiness Gates

**Status:** Active

## Project Description

M006 made adaptive planning guidance visible and resolvable without making guidance canonical state. M007 uses that derived guidance at workflow handoffs so users know when they are moving forward with weak context.

## User-Visible Outcome

Before moving from DISCUSS into RESEARCH or PLAN, users can see whether unresolved planning guidance remains, what stage it belongs to, and whether they are proceeding intentionally.

## Scope

### In Scope

- UI-only readiness gates derived from saved answers and adaptive follow-ups.
- Non-blocking warnings before adding stricter override behavior.
- Electron coverage for handoff points on the real desktop surface.
- No new database tables or hidden answer mutations.

### Out of Scope

- Model-generated readiness scoring.
- Automatic rewriting of weak answers.
- Importing Markdown as readiness source state.
- Blocking execution lifecycle phases outside the guidance-backed planning handoffs.

## Decisions

- Readiness is derived from the same follow-up map that powers memory cards and the sidebar rollup.
- Start with warnings before adding explicit override behavior.
- Revision remains the primary way to clear readiness issues.
