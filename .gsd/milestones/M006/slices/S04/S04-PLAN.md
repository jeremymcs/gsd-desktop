# S04: Phase Guidance Rollup

## Goal

Plan Builder should summarize unresolved adaptive guidance before users move from DISCUSS into later workflow phases.

## Scope

- Derive unresolved follow-ups once from saved discussion answers.
- Group unresolved guidance by DISCUSS stage in the sidebar overview.
- Reuse the derived follow-up map for discussion memory cards.
- Keep the rollup UI-only and remove it automatically when revisions resolve the weak answers.

## Acceptance

- A weak saved answer shows a Guidance rollup card.
- The rollup shows total unresolved guidance and per-stage severity counts.
- Requirement-aware signals appear in the rollup when the weak answer feeds a requirement row.
- Resolving the saved answer through revision removes the rollup.
