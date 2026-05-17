# M005: Prompt Corpus Parity and Adaptive Questioning

**Status:** Active

## Project Description

Bring the desktop Plan Builder closer to the existing GSD prompt corpus instead of letting the UI drift into a separate, hardcoded questionnaire. The current wizard has durable persistence, phase guidance, workflow preferences, and plan mutation support, but several prompt-backed concepts are still missing or only implicit.

## User-Visible Outcome

Users see the same planning concepts that the GSD workflow expects: project shape, capability contract, research decision, milestone depth, and execution handoff context. The UI keeps the workbench flow, but each prompt-backed decision becomes visible and durable.

## Scope

### In Scope

- Prompt-corpus parity gaps that can be represented as typed, database-backed UI state.
- Project shape capture in DISCUSS and generated `PROJECT.md`.
- Requirements contract refinement that mirrors the guided requirements prompt.
- Better prompt-source visibility for workflow guidance and question templates.
- Focused Electron coverage for every new user-visible prompt-backed field.

### Out of Scope

- Freeform model-generated adaptive questioning.
- Importing prompt Markdown directly at runtime.
- Replacing the current Plan Builder state machine.
- Bidirectional sync from generated Markdown back into the database.

## Decisions

- The UI should consume prompt-corpus concepts as typed product requirements, not raw prompt files.
- Project shape is a first-class project field because `PROJECT.md` already projects it and downstream prompts read it.
- The first slice should be low-risk and prove prompt parity by filling the missing Project Shape gap.
