# S03 UAT: Prompt Source Framing

## Scenario

1. Open Plan Builder and create a plan.
2. Move through DISCUSS project, requirements, and milestone stages.
3. Continue through RESEARCH, PLAN, EXECUTE, VERIFY, and SHIP.
4. Restart the desktop app and reopen Plan Builder.

## Expected Result

- The guidance card shows the current GSD prompt family and prompt filename.
- Each phase displays the expected source prompt:
  - project: `guided-discuss-project.md`
  - requirements: `guided-discuss-requirements.md`
  - milestone: `guided-discuss-milestone.md`
  - research decision: `guided-research-decision.md`
  - research: `guided-research-project.md`
  - plan: `plan-milestone.md / plan-slice.md`
  - execute: `execute-task.md`
  - verify: `run-uat.md`
  - ship: `complete-slice.md / complete-milestone.md`
- Restarted sessions show the prompt source for the restored phase.
