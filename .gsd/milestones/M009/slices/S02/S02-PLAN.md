# S02: Composer Park Action

**Goal:** Let the bottom Plan Builder composer park the active DISCUSS draft without advancing the load-bearing question.

## Tasks

- [x] Add a composer Park action beside Send for active questions.
- [x] Route composer parking through the existing non-load-bearing answer path.
- [x] Clear the composer draft after parking.
- [x] Keep the active DISCUSS question in place after parking.
- [x] Add Electron coverage for composer parking and parked-item persistence.

## Acceptance

- Typing in the composer still mirrors the card draft.
- Parking from the composer creates an Idea pool entry.
- The active DISCUSS prompt remains unchanged.
- App state contains a non-load-bearing answer and parked item linked to the original question.
