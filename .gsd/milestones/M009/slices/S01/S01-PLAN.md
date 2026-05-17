# S01: Composer Answer Submit

**Goal:** Let the bottom Plan Builder composer save the active DISCUSS answer.

## Tasks

- [x] Turn the composer footer into a submit form for active questions.
- [x] Bind composer text to the existing answer draft.
- [x] Submit composer answers through the existing load-bearing answer path.
- [x] Keep the composer read-only/status-only when no active question exists.
- [x] Add Electron coverage for composer answer persistence.

## Acceptance

- Typing in the composer mirrors the active question draft.
- Submitting from the composer advances to the next DISCUSS question.
- App state contains the saved answer with the original prompt.
