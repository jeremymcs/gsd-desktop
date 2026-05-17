# S02: Prompt-Guided Stage Framing - Plan

## Goal

Expose the next useful GSD workflow action directly in the Plan Builder UI for every workflow phase.

## Acceptance

- Plan Builder shows a workflow guidance card before a plan exists.
- DISCUSS project questioning shows a project prompt frame.
- REQUIREMENTS shows a requirements prompt frame after project depth is confirmed.
- Milestone questioning shows a milestone prompt frame after requirements depth is confirmed.
- RESEARCH DECISION appears after DISCUSS depth is complete.
- RESEARCH shows guidance while findings are being staged.
- PLAN shows guidance before and during plan proposal work.
- EXECUTE shows guidance for linked task sessions and evidence capture.
- VERIFY shows guidance for acceptance checks.
- SHIP shows guidance for handoff summary work.
- The guidance is derived from persisted plan state and survives restart.

## Notes

This slice intentionally keeps guidance as renderer-owned copy derived from existing state. It does not introduce a new guidance table or Markdown source of truth.
