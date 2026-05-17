# S01: DISCUSS Readiness Warning

## Goal

When DISCUSS is complete, unresolved adaptive guidance should be visible next to the Start research handoff.

## Scope

- Reuse the existing guidance rollup derived from saved answers.
- Render a readiness warning in the DISCUSS complete card when unresolved guidance exists.
- Keep Start research enabled for this slice.
- Add Electron coverage for the warning at the DISCUSS complete handoff.

## Acceptance

- Completing DISCUSS with a weak saved answer shows a readiness warning.
- The warning includes the unresolved count and affected DISCUSS stage.
- Start research remains available.
- No new database persistence is introduced.
