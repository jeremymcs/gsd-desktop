# S02 UAT: Execute With The Right Model

A user sets a global EXECUTE model, overrides EXECUTE for one project, and opens a task session.

## Expected

- The project override is used for that task handoff.
- Another project without an override uses the global default.
- Restart preserves the same effective model.
