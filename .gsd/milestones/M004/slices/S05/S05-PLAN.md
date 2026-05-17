# S05 Plan: Discussion Memory Question Context

## Goal

Show the original DISCUSS question on each Discussion memory entry so users can review or revise saved answers with the actual prompt in view.

## Scope

- Render each saved answer's persisted `prompt` inside the Discussion memory card.
- Keep the existing answer label as the compact card heading.
- Style the prompt as secondary card context without changing memory persistence.
- Add Electron coverage proving the prompt remains visible after answer revision and app restart.

## Acceptance

- Discussion memory cards show both the question label and exact original question.
- Revision mode keeps the question visible while editing.
- Restarted Plan Builder restores the same question context from the database-backed answer record.
- No planning schema changes are required.
