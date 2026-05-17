# S02: Explicit Research Override

## Goal

Users should explicitly acknowledge unresolved high-signal DISCUSS guidance before starting RESEARCH.

## Scope

- Detect high-signal unresolved guidance from the derived readiness rollup.
- Disable `Start research` until the user checks an acknowledgement control.
- Keep medium-signal guidance non-blocking.
- Keep the acknowledgement UI-local for this slice; do not create persistence records.

## Acceptance

- High-signal unresolved guidance disables `Start research`.
- The readiness warning explains that high-signal answers should be revised.
- Checking the acknowledgement enables `Start research`.
- Suggested follow-up prompts are still not stored as answers.
