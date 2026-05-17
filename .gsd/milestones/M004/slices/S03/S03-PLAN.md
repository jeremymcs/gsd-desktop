# S03 Plan: Preference and Phase Model Change Control

## Goal

Let users control planning phase models at two levels:

- Global defaults in Settings for DISCUSS, RESEARCH, PLAN, EXECUTE, VERIFY, and SHIP.
- Project-specific overrides in Plan Builder when a project needs a different model for a phase.

Project overrides remain database-backed planning events. Markdown preference files stay projections from `.gsd/gsd.db`.

## Scope

- Extend workflow preferences with `models.phase_overrides`.
- Add app-wide `globalPlanningPreferences.phaseModels` to persisted desktop UI state.
- Add narrow IPC for global phase model defaults and project workflow preference updates.
- Add Settings model controls for global phase defaults.
- Add Plan Builder project override controls after workflow defaults are captured.
- Verify restart persistence and generated preference projection updates.

## Acceptance

- Settings can save global phase defaults without editing project Markdown.
- Plan Builder can override a phase model for the selected project.
- Unset project phases inherit global defaults in the UI.
- `.gsd/PREFERENCES.md` includes project `phase_overrides` only.
- Restart restores both global phase defaults and project overrides.
