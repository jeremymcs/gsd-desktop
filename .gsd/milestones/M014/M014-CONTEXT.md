# M014: Composer-Driven Idea Capture

## Vision

Users need a lightweight way to park new work, risks, and change requests after DISCUSS without pretending those notes are answers to old questions. The Plan Builder composer should capture those later-phase notes into the existing database-backed idea pool, where the current review, inject, modify, and hide flows can take over.

## Success Criteria

- Later-phase composer notes can be parked as first-class idea pool items.
- The new path appends `idea.parked` without creating synthetic DISCUSS answers.
- Parking an idea from the composer does not change the active workflow phase.
- Existing idea review and change-control flows keep working.
- Electron coverage proves the real desktop surface persists the parked idea.

## Non-Goals

- Freeform natural-language execution of injections or modifications.
- Replacing the existing idea review, proposal, injection, modification, or hide forms.
- Changing generated projection semantics.
