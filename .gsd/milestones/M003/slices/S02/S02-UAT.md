# S02: Idea Review Actions - UAT

## Scenario

A user starts a plan, parks three notes on the first DISCUSS question, reviews them with Keep, Prepare, and Dismiss, then completes the workflow and restarts the app.

## Result

Passed.

Evidence:

- The same DISCUSS question remains active after parking notes.
- The idea pool shows each parked note as a separate item.
- Keep changes a parked note to `Kept`.
- Prepare changes a parked note to `Ready to promote`.
- Dismiss changes a parked note to `Dismissed`.
- Restarted Plan Builder still shows the same reviewed statuses.
- App state includes the reviewed statuses in `selectedPlan.parkedItems`.

The targeted Plan Builder Electron spec passed with 2 tests.

The full Electron core lane also ran. Both Plan Builder specs passed in that lane, and the lane finished with 61 passed and 5 failures outside the Plan Builder surface:

- `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
- `apps/desktop/tests/core/provider-settings.spec.ts:13`
- `apps/desktop/tests/core/unread-state.spec.ts:52`
