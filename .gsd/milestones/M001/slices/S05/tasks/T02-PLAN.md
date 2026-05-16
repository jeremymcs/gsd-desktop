# T02: Research Review UI

## Goal

Extend Plan Builder so a user can stage and review research findings after DISCUSS.

## Scope

- Add a RESEARCH state after all DISCUSS depth gates are confirmed.
- Seed a deterministic research brief from persisted DISCUSS memory.
- Let users edit research title/content before staging.
- Show proposed research with accept/reject controls.
- Show accepted and rejected research history in the workbench.

## Verification

- Electron coverage drives the visible controls.
- Restart coverage proves accepted research is restored from database state.
