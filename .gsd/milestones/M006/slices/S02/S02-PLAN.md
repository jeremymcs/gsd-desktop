# S02: Revision-Focused Resolution Loop

## Goal

Saved discussion memory should make unresolved adaptive guidance directly actionable while keeping user answer revision as the only canonical persistence path.

## Scope

- Add a compact action to adaptive follow-up cards when they are rendered inside saved discussion memory.
- Route that action into the existing answer revision editor.
- Preserve current draft-answer follow-ups as guidance-only cards.
- Add Electron coverage proving follow-up guidance is resolved by revising the saved answer, not by storing the suggested question as an answer.

## Acceptance

- A weak saved answer shows an adaptive follow-up with an `Edit answer` action.
- Clicking the action opens the existing revision textarea prefilled with the saved answer.
- Saving a stronger answer removes the follow-up from that memory item.
- The suggested follow-up question is never persisted as an answer.
