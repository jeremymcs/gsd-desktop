# S04 UAT: Adaptive Follow-Up Drafting

## Scenario

1. Open Plan Builder and create a plan.
2. On a DISCUSS question, type a vague answer such as `not sure`.
3. Observe the follow-up suggestion.
4. Replace the vague text with a concrete answer and save it.
5. Continue the workflow.

## Expected Result

- A suggested follow-up appears for the vague draft.
- The suggestion is specific to the active question.
- The suggestion disappears once the answer is concrete or empty.
- The saved planning answer contains only the user's explicit answer, not the suggested follow-up text.
- The full Plan Builder workflow still reaches SHIP and survives restart.
