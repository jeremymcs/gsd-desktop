# M042: Guardrail Detection Hooks

Guardrails are documented, but stop conditions are still mostly manual. The app should begin detecting deterministic guardrail states from local evidence.

## Success Criteria

- Guardrail status can be computed from available state.
- Dirty projection/worktree conflicts are surfaced before run actions.
- Tests cover detected guardrail warnings without destructive commands.
