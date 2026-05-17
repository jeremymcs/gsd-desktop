# S01 Summary: DISCUSS Readiness Warning

Plan Builder now shows a readiness warning on the DISCUSS complete handoff when unresolved adaptive guidance remains. The warning reuses the derived guidance rollup, identifies affected DISCUSS stages, and keeps `Start research` available for this first readiness-gate slice.

Verification target:

- `apps/desktop/tests/core/plan-builder.spec.ts` covers unresolved guidance at the DISCUSS complete handoff and proves the suggested follow-up prompt is not persisted as an answer.
