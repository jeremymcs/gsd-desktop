# S02: Composer Focus Retention

**Goal:** Keep the Plan Builder composer focused after composer submit and park actions.

## Tasks

- [x] Track the active composer textarea with a ref.
- [x] Focus the composer when the active DISCUSS question changes.
- [x] Return focus to the composer after saving an answer.
- [x] Return focus to the composer after parking a draft.
- [x] Add Electron coverage for submit and park focus retention.

## Acceptance

- Saving from the composer advances to the next prompt and focuses the composer textarea.
- Parking from the composer keeps the current prompt active and focuses the composer textarea.
- Existing card controls remain available.
