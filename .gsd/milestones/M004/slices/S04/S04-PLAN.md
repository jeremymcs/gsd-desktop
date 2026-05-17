# S04 Plan: Light/Dark Mode Consistency Fix

## Goal

Make Plan Builder and its workflow preference controls render cleanly in both light and dark themes without changing planning behavior.

## Scope

- Add Plan Builder-scoped theme tokens for light and dark palettes.
- Apply those tokens to panes, cards, phase strips, workflow preference controls, form fields, status states, and action buttons.
- Keep the existing dark appearance while giving light mode readable surfaces.
- Add focused Electron coverage for readable contrast across both themes.

## Acceptance

- Plan Builder no longer renders dark-only cards and inputs in light mode.
- Phase model override selects stay readable in both themes.
- Workflow preference summary text keeps readable contrast in both themes.
- Existing Plan Builder persistence behavior continues to pass.
