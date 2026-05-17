# S04: VERIFY Gate - UAT

## Scenario

A user reaches EXECUTE, links a task session, marks the accepted task done with evidence, starts VERIFY, records a passing verification note, and restarts the desktop app.

## Result

Passed.

Evidence:

- `Start verify` stays gated until the task is done with evidence.
- The VERIFY panel shows the accepted task, acceptance criteria, and saved execution evidence.
- Saving a passed verification shows `Passed` and the verification note.
- Restarted Plan Builder opens back into VERIFY with the passed result and note still visible.
- The ready-to-ship signal appears, but SHIP remains a separate future gate.

The targeted Plan Builder Electron spec passed with 2 tests.

The full `core` Electron lane passed the Plan Builder spec, but the lane still has unrelated failures outside this slice:

- `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
- `apps/desktop/tests/core/new-thread-auto-title.spec.ts:82`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
- `apps/desktop/tests/core/provider-settings.spec.ts:13`
- `apps/desktop/tests/core/unread-state.spec.ts:52`
