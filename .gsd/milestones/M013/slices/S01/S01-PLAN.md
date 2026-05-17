# S01: Composer SHIP Summary Submit

**Goal:** Let users record the final SHIP handoff summary from the bottom Plan Builder composer.

## Tasks

- [x] Enable composer text input while SHIP is active.
- [x] Route composer submit to the existing ship summary recording handler.
- [x] Clear and refocus the composer after a summary is saved.
- [x] Add focused Electron coverage for composer SHIP summary submission.

## Acceptance

- The SHIP composer accepts summary text.
- Submitting saves the summary in the existing SHIP panel.
- App state contains the composer-saved summary in `selectedPlan.shipSummaries`.
