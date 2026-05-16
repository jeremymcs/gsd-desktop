# T02: Workbench Shell UI

## Goal

Create the first Plan Builder UI shell that matches the requested dark split-pane direction without implementing the persisted wizard yet.

## Scope

- Add a `PlanBuilderView` renderer component.
- Show workspace context, phase sequence, plan outline counts, and bottom planning composer affordance.
- Add a New Thread quick action that opens Plan Builder for the selected root workspace.
- Keep labels product-facing and avoid developer-only implementation text.

## Verification

- Core desktop spec asserts the shell is visible and workspace-aware.
- Typecheck validates component contracts.
