# S02 Summary: Explicit Research Override

High-signal unresolved guidance now requires an explicit UI acknowledgement before starting RESEARCH. The override is intentionally local UI state in this slice; readiness is still derived from saved answers, and revision remains the canonical way to clear guidance.

Verification target:

- `apps/desktop/tests/core/plan-builder.spec.ts` covers the disabled Start research button, acknowledgement checkbox, and non-persistence of suggested follow-up prompts.
