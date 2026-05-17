# S01: Composer VERIFY Handoff

**Goal:** Let the Plan Builder composer start VERIFY only after every active task is done with evidence.

## Tasks

- [x] Derive top-level VERIFY readiness from the accepted plan tasks and task execution records.
- [x] Add a composer phase action that calls the existing `startVerify` handler when ready.
- [x] Keep the composer disabled/status-only while EXECUTE task evidence is incomplete.
- [x] Add Electron coverage for the composer VERIFY handoff.

## Acceptance

- The composer does not expose a VERIFY handoff before task evidence is complete.
- After every task is marked done with evidence, the composer advances to VERIFY.
- Persisted planning state reports `activePhase: "verify"` while keeping the task stage active.
