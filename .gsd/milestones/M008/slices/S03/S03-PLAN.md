# S03: Phase-Aware Projections and Restart Coverage

**Goal:** Make accepted phases visible in generated Markdown and prove they survive restart.

## Tasks

- [x] Add phase projection records to generated projection input.
- [x] Render phase sequence in project projections.
- [x] Render milestone phase membership in milestone roadmap and context projections.
- [x] Extend package projection tests for phase output.
- [x] Extend Electron coverage for phase persistence after approval, regeneration, and restart.

## Acceptance

- `.gsd/PROJECT.md` includes the phase sequence.
- `M###-ROADMAP.md` includes each milestone phase.
- `M###-CONTEXT.md` includes the phase goal.
- Accepted PLAN output still includes phase JSON after restart.
