# M029: Conflict And Scope Guardrails

**Vision:** Prevent unattended execution from plowing through unsafe scope changes.

**Success Criteria:**

- Guardrails cover test failures, destructive actions, ambiguous scope, dirty worktree conflicts, and milestone completion.
- The next-work handoff includes those guardrails.
- Tests prove guardrails persist and project into generated files.

---

## Slices

- [ ] **S01: Guardrail Policy Projection** `risk:medium` `depends:[M028]`
  > After this: stop conditions are durable and visible in UI and `.gsd/NEXT.md`.

