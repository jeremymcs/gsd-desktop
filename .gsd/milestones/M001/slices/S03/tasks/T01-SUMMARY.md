# T01 Summary: App View Wiring

Plan Builder is now a first-class desktop view through the existing `AppView` state. The primary shell keeps sidebar collapse behavior, sidebar navigation, topbar breadcrumbs, and root workspace selection consistent for `plans`.

Verification:
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm typecheck`
