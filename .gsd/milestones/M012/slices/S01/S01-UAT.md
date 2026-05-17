# S01 UAT: Composer Starts VERIFY

A user creates and accepts a plan, starts EXECUTE, records task evidence, then uses the bottom composer to start VERIFY.

## Expected

- EXECUTE remains active while task evidence is incomplete.
- The composer explains that all tasks need evidence before VERIFY.
- After task evidence is saved, the composer action advances to VERIFY.
- The VERIFY panel appears and app state persists `activePhase: "verify"` with task-stage state intact.
