# S01 Plan: Project Shape Capture

## Goal

Capture the prompt-backed project shape classification inside the DISCUSS wizard and persist it into generated project context.

## Scope

- Add a load-bearing project DISCUSS question for `simple` versus `complex`.
- Persist the response into `ProjectSummary.shape`.
- Keep default behavior conservative by treating non-`simple` answers as `complex`.
- Update Electron coverage so `PROJECT.md` contains the saved shape classification.

## Acceptance

- The project DISCUSS stage asks the shape question before the project depth gate.
- Saving an answer updates project state through the existing append-only answer/project patch flow.
- Generated `.gsd/PROJECT.md` includes `**Complexity:** complex` or `simple` plus the user rationale.
- Existing Plan Builder restart and projection behavior still passes.
