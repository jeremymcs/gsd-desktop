# S01: Workflow Preferences Bootstrap - UAT

## Scenario

A user creates a new Plan Builder plan, sees the workflow preferences card, applies the recommended defaults, continues through planning, then restarts the app.

## Result

Passed.

Evidence:

- The preferences card appears after creating a plan.
- Clicking `Apply defaults` saves the workflow preference state.
- `.gsd/PREFERENCES.md` contains the recommended defaults.
- `.gsd/runtime/research-decision.json` records the deterministic research decision.
- Restarted Plan Builder still shows workflow preferences as saved.
- The selected plan snapshot still contains the captured workflow preferences after restart.

The targeted Plan Builder Electron spec passed with 2 tests.

The full Electron core lane also ran. Both Plan Builder specs passed in that lane, and the lane finished with 61 passed and 5 failures outside the Plan Builder surface:

- `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
- `apps/desktop/tests/core/provider-settings.spec.ts:13`
- `apps/desktop/tests/core/unread-state.spec.ts:52`
