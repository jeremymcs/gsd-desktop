# S01: Phase Draft Model and Validation - UAT

## Scenario

A user starts PLAN after accepted research, and the seeded PLAN proposal contains an explicit phase row. Older accepted plan JSON without phase rows still opens and derives phases from milestone references.

## Checks

- New proposal drafts include `phases`.
- A milestone can only reference a defined phase.
- Legacy proposal JSON without `phases` parses through derived phase rows.
- Desktop typecheck and lint pass.
