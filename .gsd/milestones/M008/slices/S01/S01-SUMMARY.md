# S01: Phase Draft Model and Validation - Summary

S01 adds first-class phase rows to PLAN proposal drafts while preserving compatibility with older accepted PLAN JSON.

## Changed

- Added `PlanningPhaseDraft` and `PlanningPlanProposalDraft.phases`.
- Seeded new PLAN drafts with `P1`.
- Kept legacy JSON readable by deriving phase rows from existing milestone phase values.
- Added validation for missing, duplicate, and unknown phase references.

## Verified

- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm lint`
- `git diff --check`
