# S04 Plan: Adaptive Follow-Up Drafting

## Goal

Suggest focused follow-up questions when a planning answer is vague, while keeping saved state limited to explicit user responses.

## Scope

- Add deterministic vague-answer detection for active DISCUSS drafts and saved discussion memory.
- Map each DISCUSS question to a focused follow-up prompt.
- Render a compact follow-up suggestion in the question card and memory cards.
- Verify suggestions are UI-only and are not persisted as canonical answers.

## Acceptance

- Typing an uncertain answer such as `not sure` shows a focused follow-up suggestion.
- Clearing or replacing the vague draft removes the active suggestion.
- Saved vague answers can display a memory-side suggestion for revision.
- The planning database does not receive synthetic follow-up answers.
