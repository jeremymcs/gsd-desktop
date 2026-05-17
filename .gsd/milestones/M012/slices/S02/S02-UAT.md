# S02 UAT: Composer Starts SHIP

A user completes EXECUTE evidence, starts VERIFY, marks every task passed, then uses the bottom composer to start SHIP.

## Expected

- VERIFY remains active while any task verification is missing or failed.
- The composer explains that all task verifications need to pass before SHIP.
- After all verifications pass, the composer action advances to SHIP.
- The SHIP panel appears and app state persists `activePhase: "ship"`.
