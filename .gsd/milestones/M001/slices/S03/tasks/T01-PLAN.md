# T01: App View Wiring

## Goal

Add Plan Builder as a first-class desktop view using the existing app state, sidebar, and topbar conventions.

## Scope

- Extend the `AppView` union with `plans`.
- Keep Plan Builder on the primary shell with the existing sidebar.
- Track the root workspace selected for planning.
- Make sidebar collapse and topbar breadcrumbs work for the new view.

## Verification

- Typecheck catches view union propagation.
- Core desktop spec proves visible navigation into the view.
