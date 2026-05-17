# M001: Database-Backed Plan Builder

**Vision:** Users can create a named project plan from the desktop app, move through `DISCUSS`, `RESEARCH`, and `PLAN` in a guided UI, and get durable database-backed planning state with generated GSD Markdown projections after restart.

**Success Criteria:**
- A root workspace can create and resume multiple named plans backed by `.gsd/gsd.db`.
- Every committed user answer and plan edit persists immediately as append-only history.
- Generated research and plan proposals are staged, reviewable, and only committed after approval.
- Planning-phase Markdown projections are generated automatically and can be manually regenerated.
- Plan approval is blocked by unresolved dependency/boundary conflicts.
- The feature is verified by package tests and Electron Playwright restart/projection coverage.

---

## Slices

- [x] **S01: Planning Engine Foundation** `risk:high` `depends:[]`
  > After this: a package-level planning engine can create/open `.gsd/gsd.db`, store named plans, append events, recompute typed state, and enforce optimistic revision checks.

- [x] **S02: Projection Generator and Adoption Safety** `risk:high` `depends:[S01]`
  > After this: accepted planning state can generate GSD Markdown files through `PLAN`, including project and requirements artifacts, with ownership headers, atomic scoped writes, legacy-file protection, and manual regeneration support.

- [x] **S03: Plan Builder Navigation Shell** `risk:medium` `depends:[S01]`
  > After this: the desktop app has a workspace-aware Plan Builder view in the sidebar and a "New plan" entry from the new-thread start flow, presented in the dark split-pane workbench shell.

- [x] **S04: Persisted DISCUSS Wizard** `risk:medium` `depends:[S01,S03]`
  > After this: a user can complete project, requirements, and milestone discussion stages in the screenshot-inspired split-pane UI with prompt-compatible depth gates, edit prior answers via revision events, and see a compact outline after restart.

- [x] **S05: Research Staging and Approval** `risk:medium` `depends:[S01,S03,S04]`
  > After this: research findings can be persisted as proposed output, reviewed in UI, and committed to canonical state only after user approval.

- [x] **S06: PLAN Proposal, Editing, and Validation** `risk:high` `depends:[S01,S02,S03,S04,S05]`
  > After this: the app can propose milestones, slices, tasks, dependencies, and boundary maps, let the user edit them structurally, and block approval on lightweight validation failures.

- [x] **S07: End-to-End Desktop Verification** `risk:medium` `depends:[S02,S03,S04,S05,S06]`
  > After this: the first Plan Builder milestone is proven on the real Electron surface, including restart persistence, projection files, manual regeneration, and packaged SQLite loading.

## Boundary Map

### S01 -> S02

Produces:
  `@pi-gui/gsd-planning` domain model -> WorkspacePlan, PlanEvent, PlanSnapshot, PlanningStore
  requirement model -> Requirement, RequirementStatus, RequirementOwner, RequirementSource
  prompt-stage model -> project, requirements, milestone, research, plan, slice-context stage records
  SQLite store -> create/open DB, migrate schema, append events, read snapshots
  revision guard -> optimistic revision checks for writes

Consumes: nothing

### S01 -> S03

Produces:
  PlanningStore API -> listPlans(), createPlan(), getPlanSnapshot()
  root workspace resolver contract -> plan DB path under root workspace

Consumes: nothing

### S01 + S03 -> S04

Produces:
  question state model -> active phase, active stage, active question round, answer records, revision events
  depth gate model -> required confirmation records for project, requirements, and milestone stages
  Plan Builder route/state -> selected plan and current phase view
  workbench shell -> top mode switcher, left rail entry, split panes, pane headers, active-pane styling, bottom composer bar

Consumes from S01:
  PlanningStore API -> append answer/revision/skip/discretion/confirmation events
  prompt-stage model -> GSD-compatible project, requirements, and milestone discussion flow

Consumes from S03:
  Plan Builder shell -> workspace-aware view and plan selection

### S01 + S04 -> S05

Produces:
  staged output model -> proposed research record, approval/rejection events
  research phase state -> proposed, approved, or needs revision

Consumes from S01:
  PlanningStore API -> persist staged output and approval events

Consumes from S04:
  DISCUSS state -> accepted project shape, requirements contract, user answers, and constraints for research prompt/context

### S01 + S02 + S04 + S05 -> S06

Produces:
  plan hierarchy model -> milestone, slice, task, dependency, boundary, idea pool records
  validator -> dependency existence, cycle detection, upstream consumed-output checks, demo/must-have coverage
  approval gate -> blocked/passed validation status and committed plan events

Consumes from S01:
  PlanningStore API -> create hierarchy, append revisions, preserve stable IDs

Consumes from S02:
  projection contract -> roadmap, context, slice plan, task plan output shapes

Consumes from S04:
  DISCUSS decisions -> project shape, requirements contract, product/scope constraints, and agent-discretion rationale

Consumes from S05:
  approved research -> findings that inform slices, boundaries, and likely touched areas

### S02 + S03 + S04 + S05 + S06 -> S07

Produces:
  verification coverage -> package tests, Electron Playwright restart flow, projection file assertions, packaged SQLite load check
  repair path -> manual regenerate command verified end-to-end

Consumes from S02:
  projection writer -> generated file set and legacy safety behavior

Consumes from S03:
  desktop navigation shell -> user-visible entry and plan return path

Consumes from S04:
  DISCUSS persistence -> restart-resume scenario

Consumes from S05:
  research staging -> review/approve scenario

Consumes from S06:
  plan editing/validation -> invalid and valid approval scenarios
