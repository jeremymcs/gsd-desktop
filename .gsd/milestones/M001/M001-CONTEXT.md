# M001: Database-Backed Plan Builder

**Gathered:** 2026-05-16
**Status:** Ready for planning

## Project Description

Build a desktop Plan Builder that guides users through new project planning in the GSD lifecycle. The feature turns a friendly, step-by-step UI into durable database records, then projects those records into the Markdown files expected by the existing GSD workflow. The UI should preserve the current prompt pipeline semantics: project discussion, requirements, milestone discussion, research, roadmap planning, slice context, and validation gates. This milestone covers the first shippable planning experience through `DISCUSS`, `RESEARCH`, and `PLAN`; execution, verification, and shipping stay visible as lifecycle states but are not fully automated yet.

## Why This Milestone

The current GSD workflow is file-based and manual. Users need a guided interface that can remember every answer, survive restarts, separate proposed generated output from accepted plan state, and produce milestone, slice, and task artifacts without asking users to manage Markdown directly. This milestone establishes the canonical planning engine and the first real UI surface so later execution support has a reliable source of truth.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Open a project workspace and create a named plan from a dedicated Plan Builder surface or the new-thread start flow.
- Work in a dark, split-pane desktop workspace that visually matches the provided reference: top mode switcher, left vertical rail, pane headers, active pane outline, center content, and bottom composer controls.
- Move through clean `DISCUSS` stages for project shape, capability requirements, and milestone context, with each answer round saved immediately and visible in a compact outline.
- Restart the app and resume the same active plan, current question, prior answers, and staged output.
- Let the app run research, review the staged findings, and approve them before planning.
- Generate a proposed milestone/slice/task plan from confirmed requirements and research, edit it in structured UI before approval, and block approval on structural dependency or boundary conflicts.
- See generated `.gsd` Markdown projections update after accepted changes without treating those files as editable source.
- Use a manual "Regenerate files" action to repair missing or stale projections.

### Entry point / environment

- Entry point: Plan Builder sidebar navigation item, plus a "New plan" action from the new-thread start flow.
- Environment: local macOS desktop app with selected project workspaces.
- Live dependencies involved: local filesystem, Electron main process IPC, SQLite database, existing session runtime for linked research sessions.

## Completion Class

- Contract complete means: the planning package schema, event model, projection generation, and validation rules are covered by package-level tests.
- Integration complete means: the desktop app can create and resume a plan through the real Electron surface, persist the plan database in the root workspace, and generate expected Markdown files.
- Operational complete means: app restart, projection repair, existing `.gsd` adoption safety, native SQLite packaging, and fail-loud write/revision behavior are verified.

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- A user can create a named plan, answer multiple `DISCUSS` questions, close/reopen the app, and continue from the same wizard state with prior answers intact.
- A user can approve staged research, generate a proposed plan, edit milestone/slice/task structure in the UI, and approve only after lightweight validation passes.
- The app writes stable projections for `PROJECT.md`, `REQUIREMENTS.md`, `STATE.md`, `DECISIONS.md`, milestone context, milestone research, milestone roadmap, slice context, slice plan, and task plans through the planning phase.
- Existing manual `.gsd` Markdown files are not overwritten silently; adoption requires explicit confirmation before wizard-owned projections replace them.
- Packaged desktop builds include and can load the SQLite driver needed by the planning store.

## Architectural Decisions

### Database Is Canonical

**Decision:** Store canonical planning state in a repo-local SQLite database at `.gsd/gsd.db`; generate Markdown files as projections.

**Rationale:** The wizard needs structured, restart-safe state across every turn, while Markdown projections preserve human readability and compatibility with file-based GSD tooling.

**Alternatives Considered:**
- Transcript-only planning - rejected because structured state would depend on brittle extraction.
- Incremental Markdown editing - rejected because two-way sync and partial drafts create conflict risk.
- App-global database - rejected because plans belong to the project and should move with the workspace.

---

### Shared Planning Package

**Decision:** Create a shared planning package that owns the domain model, SQLite store, projections, and validation rules.

**Rationale:** Planning semantics should be reusable by future CLI or agent workflows and should not be trapped inside desktop UI code.

**Alternatives Considered:**
- Desktop-only implementation - faster at first, but likely to duplicate logic later.
- Pure package with Electron-owned database adapter - rejected for this milestone because one canonical engine is simpler to verify.
- Split core and SQLite packages immediately - rejected as premature package surface area.

---

### Deterministic Wizard With Adaptive Follow-Ups

**Decision:** Drive the UI from a deterministic phase/question state machine, with model-assisted adaptive follow-ups only where judgment is needed. The UI can present a focused "round" with one to three related controls when the underlying GSD stage calls for it, but it must preserve one active decision focus and wait for real user input before continuing.

**Rationale:** Reliable persistence, skipping rules, and progress indicators require typed question records; adaptive follow-ups keep the flow from becoming a rigid form.

**Alternatives Considered:**
- Fully freeform chat - rejected because plan state would depend on later extraction.
- Static form-only wizard - rejected because project planning needs contextual follow-up.
- Fully generated questions - rejected because progress and validation would be less predictable.

---

### Append-Only Event History

**Decision:** Every committed answer, edit, generated-output acceptance, parking action, deletion, and status change appends an event and recomputes typed state.

**Rationale:** Planning changes are normal, and downstream slices/tasks need an auditable reason trail for why the current structure exists.

**Alternatives Considered:**
- Rewrite current records in place - rejected because it loses decision history.
- Append only after phase completion - rejected because restarts could lose turns.
- Hard-delete before approval - rejected because IDs and projections need stable history.

---

### Generated Projections Are Read-Only Views

**Decision:** Show Markdown projections as previews and edit planning data through structured UI controls.

**Rationale:** The database is authoritative. Allowing direct Markdown edits would imply bidirectional sync, conflict handling, and unclear authority.

**Alternatives Considered:**
- Editable Markdown projection files - rejected due to sync complexity.
- Import Markdown as authoritative state - deferred because robust import is a separate feature.
- Manual export only - rejected because agents and tools should see current projections.

---

### Plan Approval Requires Lightweight Validation

**Decision:** Block approval when dependencies, boundary references, or required demo/must-have criteria are structurally invalid.

**Rationale:** The boundary map exists to make execution deterministic enough to verify; invalid plans should not enter the active queue.

**Alternatives Considered:**
- Warnings only - rejected because unresolved boundaries create downstream execution failures.
- Full semantic code-interface validation now - deferred until execution support.
- Validate only after execution starts - rejected because users need feedback before committing the plan.

---

### Requirements Are A First-Class Contract

**Decision:** Persist project requirements as first-class records with stable `R###` IDs, status, class, owner, source, validation state, and traceability.

**Rationale:** Existing GSD prompts treat requirements as the capability contract that roadmaps and validation read; the UI needs to expose that contract instead of burying it in context prose.

**Alternatives Considered:**
- Capture requirements only in milestone context - rejected because ownership and validation would be hard to track.
- Generate requirements only during roadmap planning - rejected because users need a confirmation gate before planning.
- Treat requirements as tasks - rejected because requirements describe capabilities, not implementation units.

---

### Split-Pane Desktop Workbench UI

**Decision:** The Plan Builder should use a dark, Codex-style split workspace aesthetic: top mode navigation, a narrow left rail, resizable panes with breadcrumb headers, active pane outlines, compact stage/outline panels, and bottom composer-style controls.

**Rationale:** The user wants the Plan Builder to feel like the provided desktop agent reference: focused, dense, and workbench-like, not a generic stepper, marketing page, or card-heavy dashboard.

**Alternatives Considered:**
- Full-screen form wizard - rejected because it hides the work context and feels too linear for planning.
- Dashboard/card layout - rejected because it would fight the conversation-first desktop direction.
- Plain chat-only surface - rejected because planning needs persistent structure, previews, and lifecycle state alongside the current prompt.

## Error Handling Strategy

The planning store should fail loud and preserve data. Database mutations run inside transactions with optimistic revision checks; stale writers receive clear errors instead of silently overwriting state. User answers and answer rounds are saved before generated processing begins. Projection writes are atomic and scoped to files whose generated content changed. Existing `.gsd` files without wizard ownership headers are treated as legacy references and are never overwritten without explicit confirmation. SQLite/native-module load failures should show a user-facing setup/runtime error and prevent plan creation rather than falling back to a weaker hidden store. Agents and tools should use the planning package/tool APIs instead of reading or mutating `.gsd/gsd.db` directly, so WAL ownership and validation rules stay centralized.

## Risks and Unknowns

- Native SQLite packaging - `better-sqlite3` must be rebuilt and packaged correctly with Electron and pnpm.
- Existing `.gsd` adoption - users may already have manual files, so overwrite safety and clear ownership headers are required.
- Wizard rigidity - deterministic questions can feel mechanical if adaptive follow-ups are not used carefully.
- Projection authority confusion - agents may read Markdown as source of truth unless generated headers clearly state that the database is canonical.
- Schema migration pressure - planning records will evolve as execution support lands, so the schema needs explicit versioning from the start.
- Prompt parity drift - the desktop UI can fall out of sync with the existing GSD prompts unless stage templates and gates are treated as product requirements.

## Existing Codebase / Prior Art

- `DesktopAppStore` - central Electron-side app state and persistence coordinator that the new planning IPC should integrate with rather than bypass.
- `JsonCatalogStore` - existing workspace/session catalog persistence pattern; useful prior art for narrow store APIs and cloning boundaries, but not the storage choice for planning.
- `NewThreadView` - current creation surface for starting work; new plan creation should be reachable from this flow without replacing the plain composer.
- `Sidebar` - existing top-level navigation and workspace/session list surface; Plan Builder needs a returning navigation affordance here.
- `ComposerSurface` and timeline/session surfaces - execution should continue to use normal session UI rather than embedding full execution inside the wizard.
- Reference screenshot from 2026-05-16 - desired visual language: dark desktop shell, top mode switcher, split panes, pane breadcrumbs, active-pane outline, center empty state/question area, suggestion/action list, and bottom composer bar.
- `GSD-WORKFLOW` - source workflow for hierarchy, projection filenames, phase semantics, and validation expectations.
- `GSD prompts` - current source examples for project discussion, requirements, milestone discussion, research, roadmap planning, slice context, depth verification, and DB-backed artifact rendering.

## Relevant Requirements

- R001 - Database-backed planning state with Markdown projections.
- R002 - Friendly guided UI for `DISCUSS`, `RESEARCH`, and `PLAN`.
- R003 - Immediate persistence across every user turn and app restart.
- R004 - Milestone, slice, and task hierarchy with stable IDs and editable pre-execution structure.
- R005 - Projection compatibility with existing GSD workflow files.
- R006 - Lightweight boundary/dependency validation before plan approval.
- R007 - Real Electron verification, including restart persistence and generated file output.
- R008 - First-class project and requirements artifacts that mirror the existing guided GSD prompts.
- R009 - Screenshot-inspired split-pane Plan Builder UI that feels like a desktop agent workbench.

## Scope

### In Scope

- Shared planning package with SQLite store, schema versioning, append-only events, typed state, projections, and lightweight validation.
- Repo-local `.gsd/gsd.db` creation for root workspaces.
- Automatic `.gitignore` entry for `.gsd/gsd.db` when the planning DB is created.
- Multiple named plans per root workspace, with one active plan by default.
- Plan Builder top-level UI plus a new-plan entry point from the new-thread flow.
- Screenshot-inspired Plan Builder layout: top mode switcher, left rail, split pane/workspace shell, pane headers, current question pane, compact outline/projection pane, and bottom composer-style action controls.
- One-question-at-a-time `DISCUSS` flow with answer edits, skips for non-load-bearing questions, and agent-discretion rationale for load-bearing questions.
- Project discussion, requirements discussion, milestone discussion, and depth-confirmation gates modeled after the existing GSD prompt corpus.
- First-class requirements records with `R###` IDs, Active/Validated/Deferred/Out of Scope status, owner, source, validation state, and traceability.
- Agent-driven `RESEARCH` with staged findings and user approval checkpoint.
- `PLAN` proposal review, structured editing, revision events, boundary/dependency validation, and approval.
- Workspace-level idea pool for parked work, linked back to the source plan/item.
- Generated planning-phase Markdown projections and manual regeneration.
- Package tests and Electron Playwright tests for create, restart, validation, and projections.

### Out of Scope / Non-Goals

- Full automated `EXECUTE`, `VERIFY`, and `SHIP` implementation.
- Git commit, push, pull request, package publish, or release automation.
- Full import/migration from existing manual `.gsd` Markdown into database records.
- Bidirectional Markdown sync.
- Real-time collaboration or multi-writer merge UI.
- Semantic code-interface validation of boundary maps.
- Per-worktree independent plans.
- Replacing the normal session/thread execution UI.

## Technical Constraints

- The renderer must not receive broad filesystem or process access; planning operations go through narrow IPC in the Electron main process.
- UI implementation must preserve the reference workbench feel: dark palette, restrained warm accent, compact controls, stable pane dimensions, active-pane border treatment, and no marketing-style hero/cards.
- Text and controls must fit in compact panes at desktop sizes; panes, headers, icon buttons, and bottom bars need fixed/responsive constraints to avoid layout shift.
- Planning data is scoped to the root workspace; worktrees can be used for execution sessions but do not own independent plans.
- `.gsd/gsd.db` is ignored and must not be committed; Markdown projections are the committed portable artifacts.
- Generated projections need ownership headers, hidden DB UUID metadata, readable `M001/S01/T01` identifiers, and atomic scoped writes.
- `PROJECT.md` and `REQUIREMENTS.md` are planning-phase projections and must be generated through the same DB-backed projection path as milestone artifacts.
- Agents, UI actions, and future CLI tools should not inspect the SQLite database directly; they should go through planning package APIs that own the connection and validation.
- Milestone/slice/task numbers are immutable once assigned; ordering is a separate field.
- Current desktop target is macOS; Linux CI can verify generic checks but is not the desktop truth for this milestone.
- Existing app/session JSON persistence remains in place; planning SQLite does not replace it.

## Integration Points

- Electron main IPC - exposes narrow plan operations to the renderer.
- Desktop app state/navigation - surfaces Plan Builder as a top-level workspace-aware view.
- Root workspace filesystem - stores `.gsd/gsd.db`, projections, and `.gitignore` mutation.
- Existing session runtime - runs or links research sessions without making transcript parsing the source of truth.
- GSD prompt corpus - informs stage order, depth gates, requirements contract, and roadmap planning semantics.
- Test harness - verifies package behavior and real Electron restart/projection flows.
- Packaging pipeline - proves the SQLite native dependency loads in built desktop artifacts.

## Testing Requirements

Package tests should cover schema initialization, migrations, append-only events, state recomputation, staged versus committed generated output, requirement records, projection generation, atomic changed-file detection, legacy-file safety, numbering stability, parking/removal behavior, and dependency/boundary validation. Electron Playwright tests should cover creating a plan from the UI, answering project/requirements/milestone `DISCUSS` stages, restarting and resuming state, approving staged research, editing a proposed plan, blocking invalid approval, generating projections, and manually regenerating files. Packaging verification must include loading the SQLite driver in the built desktop app.

## Acceptance Criteria

- S01 proves the shared planning package can create a repo-local SQLite store, save event-backed plans, recompute typed state, and protect writes with transactions/revision checks.
- S02 proves generated Markdown projections match the GSD file layout through `PLAN`, including `PROJECT.md` and `REQUIREMENTS.md`, are read-only/generated, write atomically, skip unchanged files, and protect legacy files.
- S03 proves users can find and open Plan Builder from sidebar navigation and start a new plan from the new-thread flow.
- S04 proves the `DISCUSS` UI supports project, requirements, and milestone stages in the split-pane workbench, saves every answer round immediately, supports revisions/skips/discretion rationale, enforces depth confirmation gates, and shows a compact outline.
- S05 proves `RESEARCH` output is generated or linked, persisted as proposed, reviewed by the user, and only committed after approval.
- S06 proves `PLAN` output creates editable milestones, slices, tasks, boundaries, and dependencies with stable IDs and validation before approval.
- S07 proves app restart, projection regeneration, SQLite packaging, and Electron end-to-end flows work on the real desktop surface.

## Open Questions

- Exact initial question library content - current thinking is to seed it from the existing GSD prompt corpus and expose it as structured stage templates rather than inventing a new questionnaire.
- Exact pane composition details - current thinking is current question in the primary pane, compact structured outline/projection preview in an adjacent pane, and stage/model/action controls in a bottom composer bar, matching the provided dark split-workbench reference.
- Research execution mechanism - current thinking is to use linked normal sessions where possible while persisting staged findings in the planning DB.
