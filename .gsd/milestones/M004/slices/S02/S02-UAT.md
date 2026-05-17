# S02: Prompt-Guided Stage Framing - UAT

## Scenario

A user opens Plan Builder, creates a plan, moves through DISCUSS, RESEARCH, PLAN, EXECUTE, VERIFY, SHIP, and restarts the app.

## Result

Passed.

Evidence:

- The guidance card appears before plan creation.
- The banner starts at `QUESTIONING / project`.
- The banner changes to `REQUIREMENTS` after project depth is confirmed.
- The banner changes to `QUESTIONING / milestone` after requirements depth is confirmed.
- The banner changes to `RESEARCH DECISION` after DISCUSS is complete.
- The banner changes to `RESEARCH`, then `PLAN`, then `EXECUTE`, then `VERIFY`, then `SHIP` as the workflow advances.
- Restarted Plan Builder still shows `SHIP` for a shipped plan.

The targeted Plan Builder Electron spec passed with 2 tests.

The full Electron core lane also ran. Both Plan Builder specs passed in that lane, and the lane finished with 61 passed and 5 failures outside the Plan Builder surface:

- `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
- `apps/desktop/tests/core/provider-settings.spec.ts:13`
- `apps/desktop/tests/core/unread-state.spec.ts:52`
