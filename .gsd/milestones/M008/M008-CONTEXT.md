# M008: Phase-Aware Plan Structure

## Vision

Plan Builder should treat phases as first-class PLAN structure, not just a free-text milestone note. The user asked for plans to be sliced into milestones, phases, slices, and tasks; the accepted plan JSON and generated projections should reflect that hierarchy clearly.

## Success Criteria

- PLAN proposals carry explicit phase records with stable IDs, names, and goals.
- Milestones reference a defined phase.
- Older accepted PLAN JSON without top-level phases still opens through a compatibility path.
- The PLAN editor lets users revise phases and milestone phase assignment.
- Generated Markdown makes the phase structure visible.
- Electron coverage proves phases survive PLAN approval, projection regeneration, and restart.

## Non-Goals

- Reworking execution order or task dependency semantics.
- Migrating existing database events.
- Adding model selection per phase beyond the existing workflow phase model preferences.
