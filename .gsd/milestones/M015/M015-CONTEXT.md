# M015: Composer-Driven Idea Review

## Vision

Parking a later-phase note should not be a dead end. After the composer captures a change request, the user should get an immediate, low-friction review step that routes the note into the existing idea lifecycle: keep it, prepare it for change-control, or dismiss it.

## Success Criteria

- The composer shows a review follow-up for the most recently parked composer note.
- The follow-up uses the existing `idea.reviewed` path and does not invent a second review model.
- Reviewing from the composer updates the idea pool status and preserves workflow phase.
- Electron coverage proves the real desktop surface can park, immediately review, and persist the reviewed status.

## Non-Goals

- Freeform natural-language injection, modification, or deletion.
- Replacing the existing idea pool or change proposal forms.
- Changing generated Markdown projection semantics.
