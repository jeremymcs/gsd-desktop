# S04 UAT: Readiness Gate Persistence Semantics

## Scenario

1. Complete DISCUSS with one high-signal unresolved answer.
2. Acknowledge the readiness override.
3. Start RESEARCH.
4. Stage and accept research.
5. Inspect planning state.

## Expected Result

- The saved answer count still matches the explicit DISCUSS answers.
- No answer contains the suggested follow-up prompt.
- Readiness warnings remain derived UI, not stored planning memory.
