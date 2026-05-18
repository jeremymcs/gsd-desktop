# M024: Requirement Coverage Mapping

## Vision

Requirements should not stop at DISCUSS memory. Once the user accepts a PLAN, each requirement should have visible coverage through milestones, slices, or tasks so execution can prove the right work is being done.

## Success Criteria

- Plan tasks or slices can reference requirement IDs.
- PLAN validation detects unknown requirement references.
- The UI summarizes uncovered active requirements before execution.
- Markdown projections include requirement coverage tables.
- Restart and projection tests prove coverage survives.

## Non-Goals

- Automatic semantic requirement matching.
- Blocking every exploratory or optional task from execution.
- Changing the requirement ID format.
- Removing manually-authored requirement prose.
