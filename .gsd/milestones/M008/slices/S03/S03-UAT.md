# S03: Phase-Aware Projections and Restart Coverage - UAT

## Scenario

A user reaches PLAN, edits phases, accepts the PLAN, regenerates projections, ships the plan, and restarts Plan Builder.

## Checks

- Accepted PLAN output includes `phases`.
- `.gsd/PROJECT.md` includes the phase sequence.
- `M###-ROADMAP.md` includes milestone phase membership.
- `M###-CONTEXT.md` includes the phase goal.
- Restarted Plan Builder still has the accepted phase-aware PLAN output.
