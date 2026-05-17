# S03 UAT

## Scenario

1. Open Settings > Models.
2. Set DISCUSS to `openai:gpt-5` and RESEARCH to `openai:gpt-4o`.
3. Open Plan Builder and create a plan.
4. Apply workflow defaults.
5. Override EXECUTE for the project to `openai:gpt-4o`.
6. Restart the app.

## Expected

- Global phase defaults remain in desktop state after restart.
- The project EXECUTE override remains in the plan database after restart.
- The Plan Builder preferences card shows unset phases as using global defaults.
- `.gsd/PREFERENCES.md` includes `phase_overrides.execute.model: gpt-4o`.

## Verification

- `pnpm --filter @pi-gui/gsd-planning test`
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/plan-builder.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:runner -- apps/desktop/tests/core/model-scope-toggle.spec.ts`
- `pnpm --filter @pi-gui/desktop run test:e2e:core`

Full `core` rerun result: 61 passed, 5 failed in pre-existing unrelated specs:

- `apps/desktop/tests/core/integrated-terminal.spec.ts:15`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:179`
- `apps/desktop/tests/core/new-thread-composer.spec.ts:235`
- `apps/desktop/tests/core/provider-settings.spec.ts:13`
- `apps/desktop/tests/core/unread-state.spec.ts:52`
