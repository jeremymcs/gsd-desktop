# M013: Composer-Driven Ship Closeout

## Vision

The Plan Builder composer should remain the primary input through the final SHIP closeout, not stop at the phase handoff. M012 lets the composer start SHIP; this milestone lets users write and save the final handoff summary from the same bottom composer while preserving the existing SHIP panel.

## Success Criteria

- The composer accepts text during SHIP.
- Submitting the SHIP composer records a ship summary through the existing database-backed handler.
- Existing SHIP summary controls continue to work.
- Keyboard submit and restart coverage prove the composer closeout behaves like durable planning memory.

## Non-Goals

- Replacing the SHIP panel summary editor.
- Generating ship summaries automatically.
- Changing ship summary projection semantics.
