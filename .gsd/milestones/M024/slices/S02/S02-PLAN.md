# S02: Coverage Validation Gate

**Goal:** Warn users when requirement coverage is missing or invalid.

## Tasks

- [x] Add validation for unknown requirement IDs.
- [x] Summarize active requirements with no coverage.
- [x] Keep unknown references as blocking errors.
- [x] Treat uncovered active requirements as explicit warnings before EXECUTE.

## Acceptance

- Unknown requirement references block plan acceptance.
- Uncovered active requirements are visible before execution.
- Users can still proceed when coverage gaps are intentionally deferred.
