# S03: Requirement-Aware Guidance

## Goal

Requirements-stage adaptive guidance should identify which requirement contract row is at risk when a saved requirements answer is too vague.

## Scope

- Pass existing requirement rows into adaptive follow-up derivation.
- Add requirement contract signals for weak requirements answers.
- Keep follow-ups derived from state only; do not write guidance prompts or signals to planning memory.
- Cover the behavior on the Electron Plan Builder surface.

## Acceptance

- A weak capabilities answer shows its follow-up as tied to `R001`.
- The follow-up signals include the requirement type and validation status.
- The rationale explains that the answer feeds the requirement contract before PLAN.
- Existing answer revision remains the way to resolve the follow-up.
