# S01: Active Prompt Regression Guard

**Goal:** Prevent the duplicate active-question UI from returning.

## Tasks

- [x] Add an Electron assertion that the active DISCUSS prompt is only presented in the composer input context.
- [x] Assert the workflow guidance card names the phase/artifact without duplicating the exact active prompt.
- [x] Keep saved memory prompt assertions intact.
- [x] Run the focused Plan Builder spec and the full Plan Builder spec.

## Acceptance

- The active prompt is visible where the user answers.
- There is no second active question form above the composer.
- Saved answers still display their original prompt in discussion memory.
