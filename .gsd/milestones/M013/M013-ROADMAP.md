# M013: Composer-Driven Ship Closeout

**Vision:** The bottom Plan Builder composer should capture the final SHIP handoff summary, completing the composer-driven workflow from DISCUSS through SHIP.

**Success Criteria:**

- Composer text input is enabled during SHIP.
- Composer submit saves a ship summary through the existing planning event path.
- Keyboard submit works for SHIP summaries.
- Restart coverage proves composer-saved SHIP summaries persist.

---

## Slices

- [x] **S01: Composer SHIP Summary Submit** `risk:medium` `depends:[M012]`
  > After this: a user can type a SHIP summary in the bottom composer and save it as the current ship summary.

- [x] **S02: Composer SHIP Summary Keyboard and Restart** `risk:medium` `depends:[S01]`
  > After this: command/control-enter saves the SHIP composer summary and restart restores the saved closeout.

## Boundary Map

### M012 -> S01

Produces:
  SHIP composer state -> bottom composer remains visible after the final phase handoff

Consumes:
  ship summary submit -> same `recordShipSummary` planning event path as the visible SHIP card

### S01 -> S02

Produces:
  composer closeout input -> final workflow input at the bottom composer

Consumes:
  keyboard and restart coverage -> durable closeout behavior proven through Electron
