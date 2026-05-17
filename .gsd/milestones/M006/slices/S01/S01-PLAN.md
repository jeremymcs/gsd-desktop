# S01 Plan: Follow-Up Signal Detail

## Goal

Make adaptive follow-up suggestions explain what is missing from an answer and how risky the gap is, while keeping follow-up state derived from existing answers.

## Scope

- Add deterministic follow-up severity.
- Add missing-context signal labels.
- Render the signal detail on active draft and saved memory follow-up cards.
- Verify the extra guidance is UI-only and not persisted as planning answers.

## Acceptance

- A vague answer such as `not sure` shows a high-severity follow-up.
- The follow-up card lists concrete missing-context labels.
- Clearing the draft removes the active follow-up.
- Existing persistence checks still prove suggested follow-up text is not saved as an answer.
