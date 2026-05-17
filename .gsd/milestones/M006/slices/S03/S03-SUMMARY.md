# S03 Summary: Requirement-Aware Guidance

Adaptive follow-ups now accept existing requirement rows as context. Weak requirements answers still use deterministic answer analysis, but saved memory can now show which requirement row, type, and validation status the weak answer affects.

Verification target:

- `apps/desktop/tests/core/plan-builder.spec.ts` covers requirement-aware follow-up signals on the Electron surface.
