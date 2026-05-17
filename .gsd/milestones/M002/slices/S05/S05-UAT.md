# S05: SHIP Gate - UAT

## Scenario

A user reaches VERIFY, saves a passing task verification, starts SHIP, saves a handoff summary, and restarts the desktop app.

## Result

Passed.

Evidence:

- `Start ship` appears only after all task verifications pass.
- The SHIP panel shows verified task evidence and verification notes.
- Saving the handoff summary records visible `Ship summary saved` state.
- Restarted Plan Builder opens back into SHIP with the saved summary still visible.
- App state reports the selected plan active phase as `ship`.

The targeted Plan Builder Electron spec passed with 2 tests.

The full `core` Electron lane passed the Plan Builder spec, but the lane still has unrelated failures outside this slice:

- `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
- `apps/desktop/tests/core/provider-settings.spec.ts:13`
- `apps/desktop/tests/core/unread-state.spec.ts:52`
