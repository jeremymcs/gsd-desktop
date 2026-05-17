# S03 Plan: Prompt Source Framing

## Goal

Show which GSD prompt family is shaping the current Plan Builder phase without loading prompt Markdown at runtime.

## Scope

- Add a static prompt-source map for DISCUSS, RESEARCH, PLAN, EXECUTE, VERIFY, and SHIP guidance.
- Render prompt family, prompt filename, and purpose in the existing workflow guidance card.
- Keep canonical state database-driven; prompt source framing is UI metadata only.
- Extend Electron coverage across the full Plan Builder flow.

## Acceptance

- The guidance card identifies the prompt source for the active phase or stage.
- DISCUSS project, requirements, and milestone stages show their matching guided prompt files.
- Later workflow phases show research, plan, execute, verify, and closeout prompt sources.
- Prompt framing survives restart because it derives from current phase/stage, not a separate persisted field.
