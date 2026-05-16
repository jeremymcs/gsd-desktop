# S02 UAT: Projection Generator and Adoption Safety

This is developer-facing UAT for projection generation.

## Checks

- Run `pnpm --filter @pi-gui/gsd-planning test`.
- Run `pnpm typecheck`.
- Confirm generated files include the `pi-gui-plan-builder-generated` header.
- Confirm a second regeneration skips unchanged files.
- Confirm a hand-written `.gsd/PROJECT.md` is blocked unless explicit overwrite is allowed.

## Expected Result

All checks pass. No desktop UI is expected in S02.

