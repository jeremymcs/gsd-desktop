# S04 Summary: Phase Guidance Rollup

Plan Builder now derives a single adaptive follow-up map from saved discussion answers and uses it for both memory cards and a sidebar Guidance rollup. The rollup groups unresolved guidance by DISCUSS stage, shows severity counts, carries requirement-aware signals, and disappears once revisions resolve the weak answers.

Verification target:

- `apps/desktop/tests/core/plan-builder.spec.ts` covers rollup appearance, requirement-stage signals, and removal after answer revision.
