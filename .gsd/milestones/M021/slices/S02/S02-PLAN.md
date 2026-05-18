# S02: Prompt Context Cleanup

**Goal:** Make active, follow-up, and memory prompts distinct in code and tests.

## Tasks

- [ ] Audit Plan Builder prompt-related test ids and helper names.
- [ ] Rename stale active-question form language where it no longer matches the UI.
- [ ] Keep backwards-compatible test ids only where existing tests need them.
- [ ] Verify Plan Builder tests still pass.

## Acceptance

- The code separates active composer prompt, adaptive follow-up prompt, and saved memory prompt.
- Tests describe the current composer-first behavior.
- No database or event model changes are required.
