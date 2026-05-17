# S02: Composer SHIP Summary Keyboard and Restart

**Goal:** Prove SHIP composer summaries behave like durable workflow input, including keyboard submit and restart restore.

## Tasks

- [ ] Route command/control-enter through SHIP composer submit.
- [ ] Add Electron coverage for keyboard submit during SHIP.
- [ ] Restart the app after a composer-saved summary and assert the saved summary restores.

## Acceptance

- `Control+Enter` saves the SHIP composer summary.
- Restarted Plan Builder shows the saved SHIP summary.
- App state still reports `activePhase: "ship"` with the saved summary.
