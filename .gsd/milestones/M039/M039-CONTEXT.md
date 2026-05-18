# M039: Handoff Bundle Export

Generated projections are useful, but users also need a compact handoff bundle for another session or agent that combines active plan, next work, recovery, and guardrails.

## Success Criteria

- A handoff bundle is generated from database state.
- The bundle references relevant projection files and recovery state.
- UI exposes a copy/open action without broad filesystem writes.
