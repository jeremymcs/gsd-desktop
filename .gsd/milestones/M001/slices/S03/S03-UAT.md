# S03 UAT: Plan Builder Navigation Shell

## Acceptance Checks

- Open a workspace in the desktop app.
- Click `Plans` in the sidebar.
- Confirm the Plan Builder shell opens and the title reads `Build a plan for <workspace>`.
- Confirm the topbar breadcrumb shows `Plans`.
- Confirm the sidebar `Plans` entry is active.
- Open `New thread`, then click `Plan a new project`.
- Confirm the Plan Builder shell reopens for the same workspace.

## Automated Proof

`apps/desktop/tests/core/plan-builder.spec.ts` covers the acceptance checks above on the Electron surface.

## Remaining Risk

The full desktop core lane is not green in this workspace. The failing specs are outside the Plan Builder path and were reproduced after the targeted Plan Builder spec passed.
