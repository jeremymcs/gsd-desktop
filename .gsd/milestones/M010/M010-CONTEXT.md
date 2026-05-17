# M010: Composer-First DISCUSS Polish

## Vision

M009 made the Plan Builder composer functional. M010 makes it feel intentional: the active question should stay visible while typing, the composer should stay ready for the next turn, and keyboard users should be able to submit without reaching for the mouse.

## Success Criteria

- The active DISCUSS question remains visible inside the composer while the user types.
- Composer actions keep focus in the composer after save or park.
- A keyboard shortcut can submit the active composer answer.
- Existing card-based controls remain available and unambiguous.
- Electron coverage proves the visible user flow on the real Plan Builder surface.

## Non-Goals

- Removing the question card input.
- Adding model-generated follow-up questions.
- Persisting unsent draft keystrokes as canonical planning records.
