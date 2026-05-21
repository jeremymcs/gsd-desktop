# GSD Desktop

GSD Desktop is a project-centered workspace for planning, discussing, executing, verifying, and shipping software work from a local codebase.

## Language

**Project**:
The user-facing container for a repo or product effort.
_Avoid_: Workspace, repo, folder

**Workspace**:
The implementation term for a filesystem-backed project root or linked worktree.
_Avoid in UI_: Project

**Thread**:
A durable conversation or work session within a Project.
_Avoid_: Chat, Session, Conversation

**Thread Purpose**:
The lightweight intent of a Thread: general, plan, research, execute, review, or follow-up.
_Avoid_: Unclassified chat type, heavy workflow state

**Threads Page**:
The Project page for browsing and opening Threads.
_Avoid_: Project Overview, chat-only home

**Archived Thread**:
A Thread removed from active attention surfaces but still recoverable from the Threads Page.
_Avoid_: Deleted thread, hidden history

**Session**:
The implementation term for a Thread's persisted runtime and transcript state.
_Avoid in UI_: Thread

**Backlog**:
A Project-owned list of saved follow-up items that may become a Thread, Plan change, or dismissed idea.
_Avoid_: Memory, to-do list, active plan

**Backlog Category**:
The lightweight type of a Backlog item: idea, question, bug, risk, follow-up, decision, or task.
_Avoid_: Full project board status

**Backlog Status**:
The lifecycle state of a Backlog item: open, in discussion, promoted, dismissed, or done.
_Avoid_: Full task board workflow

**Park for Later**:
A secondary guided-question action for saving rough context that should not become an Answer yet.
_Avoid_: Primary answer action, equal save choice

**Plan**:
A Project-owned executable work contract that moves from discussion through research, structure, execution, verification, and ship handoff.
_Avoid_: Document, checklist, markdown file

**Current Plan**:
The primary active Plan for a Project.
_Avoid_: Multiple competing active plans

**Plan Lane**:
A future concept for explicit parallel planning streams inside one Project.
_Avoid for now_: Current implementation, accidental active plan

**Plans Page**:
The Project page for current and historical Plans.
_Avoid_: Projection editor, task-only board

**Guided Plan Mode**:
The Plans Page mode for creating or updating a Plan through guided questions.
_Avoid_: Separate onboarding page, generic wizard

**Question Frame**:
A reusable guided question template for a Workflow Stage.
_Avoid_: Duplicate prompt, hard-coded questionnaire

**Question Frame Source**:
The prompt file or template provenance used to create or version a Question Frame.
_Avoid_: Prompt file as runtime source of truth

**Question Frame Snapshot**:
The Plan-specific record of the Question Frame versions used while asking guided questions.
_Avoid_: Mutable global prompt history

**Plan Change**:
A first-class reviewable object that proposes edits to an existing Plan.
_Avoid_: Silent plan mutation, automatic scope change, backlog state

**Plan Change Status**:
The lifecycle state of a Plan Change: draft, ready for review, accepted, rejected, or superseded.
_Avoid_: Done, task status

**Plan Revision**:
An accepted version of a Plan created when a Plan Change is applied.
_Avoid_: Markdown history, unchecked overwrite

**Projection**:
A generated file or view derived from database-backed Project state.
_Avoid_: Source of truth

**Generated File**:
A file output produced from database-backed Project state, such as `.gsd/*.md`.
_Avoid_: Primary planning UI, source of truth

**Import Flow**:
A review flow that turns external or edited projection content into proposed database-backed changes.
_Avoid_: Direct projection edit as source of truth

**Workflow Stage**:
One of the canonical GSD steps: Discuss, Research, Plan, Execute, Verify, or Ship.
_Avoid_: Phase, step

**Workflow**:
The GSD process from Discuss through Ship.
_Avoid_: Generic automation, sidebar category, project page label

**Skipped Stage**:
A Workflow Stage intentionally bypassed with a recorded reason.
_Avoid_: Missing work, hidden default

**Skipped Question**:
A guided question intentionally bypassed with a recorded reason.
_Avoid_: Unanswered required question, forgotten context

**Question State**:
The status of a guided question: current, answered, skipped, or needs review.
_Avoid_: One-way wizard step

**Optional Question**:
A guided question that can enrich planning but does not block Stage Readiness.
_Avoid_: Endless wizard depth

**Stage Readiness**:
The conditions required to move from one Workflow Stage to the next.
_Avoid_: Blind next button

**Guided Progress**:
The progress display for Guided Plan Mode, combining Workflow Stage status and question progress.
_Avoid_: Raw question count as the main story

**Stage Strip**:
The visual Workflow Stage map for Discuss through Ship.
_Avoid_: Hidden progress on small windows

**Risk Acceptance**:
An explicit decision to proceed despite incomplete verification evidence.
_Avoid_: Silent verify skip, unverified ship

**Verification Evidence**:
A concrete record of what was checked, how it was checked, and what happened.
_Avoid_: Vague tested claim, unsupported pass

**Ship Handoff**:
The final shipment record for a Plan or Plan Revision.
_Avoid_: End state only, unstructured summary

**Phase**:
An optional grouping inside an accepted Plan's work breakdown.
_Avoid_: Workflow stage

**Milestone**:
A meaningful delivery checkpoint inside a Plan.
_Avoid_: Phase, epic

**Slice**:
A vertical piece of a Milestone that can be executed and verified independently.
_Avoid_: Task group, sub-project

**Current Slice**:
The Slice the user or agent is focused on now.
_Avoid_: Only active work

**Active Slice**:
A Slice currently in progress in any Thread or Worktree.
_Avoid_: Current slice

**Slice Scope**:
Whether a Slice is required, optional, or stretch for its Milestone.
_Avoid_: Ambiguous priority, hidden release gate

**Priority**:
The ordering signal for what should be worked on first.
_Avoid_: Release gate, scope role

**Acceptance Check**:
A short user- or business-language condition that proves a Slice is done.
_Avoid_: Implementation-only checklist, vague done state

**Task**:
The smallest planned unit of execution that should produce evidence.
_Avoid_: Slice, todo

**Project Overview**:
The Project landing page that summarizes status, recent activity, open follow-ups, and recommended next actions.
_Avoid_: Home chat, default thread

**Settings**:
App-level defaults and integrations that apply across Projects unless overridden.
_Avoid_: Project preferences

**App Defaults**:
The global default behavior used unless a Project, Thread, or Slice overrides it.
_Avoid for now_: Team defaults

**Project Preferences**:
Project-specific overrides for workflow behavior, stage models, and local defaults.
_Avoid_: Settings

**Preference Change**:
A recorded update to Settings or Project Preferences.
_Avoid_: Silent execution behavior change

**Project Skills Page**:
The Project page for managing Project Skills and available Skill guidance.
_Avoid_: Preferences section

**Project Extensions Page**:
The Project page for managing Project Extensions and integration configuration.
_Avoid_: Preferences section

**Project Navigation**:
The per-Project sidebar pages: Project Overview, Threads, Plans, Backlog, Worktrees, Skills, Extensions, Project Preferences.
_Avoid_: Global app navigation, changing tab order

**Sidebar Collapse Control**:
The control for collapsing or expanding Project Navigation.
_Avoid_: Workspace tab action, overlapping project item action

**Global Navigation**:
The app-level navigation outside the active Project: workspace tabs, new/open Project, Search, and Settings.
_Avoid_: Project pages, chat-app navigation

**Toast Notification**:
A temporary status message for non-blocking feedback.
_Avoid_: Persistent confirmation, blocking notice

**GSD**:
The product/system guiding project planning and execution.
_Avoid_: Generic assistant as product actor

**Agent**:
An executing worker acting inside a Thread, Slice, or task.
_Avoid_: Product/system name

**Workspace Tab**:
A top-level tab representing one open Project.
_Avoid_: Thread tab, page tab, mixed navigation tab

**Window Controls**:
The operating-system or app-shell controls for closing, minimizing, maximizing, and window layout.
_Avoid_: Duplicate fake controls

**Theme Tokens**:
The shared color and spacing variables that define dark and light mode surfaces.
_Avoid_: Page-specific hard-coded theme colors

**GSD Dark Theme**:
The product-wide dark theme using the purple/blue visual direction.
_Avoid_: Plan-only theme, one-page styling

**Design System Doc**:
A future implementation-facing document for reusable theme and component rules.
_Avoid_: Replacing product vocabulary source of truth

**Search Scope**:
The boundary for search results: current Project by default, or All Projects when explicitly selected.
_Avoid_: Ambiguous global search

**Inbox**:
A future global cross-project notification surface.
_Avoid for now_: Project backlog, project overview replacement, miscellaneous bucket

**Model**:
A provider/model selection used for agent work.
_Avoid_: Vendor-branded product concept, provider-only label

**Reasoning**:
The user-facing control for how much deliberation a model should use.
_Avoid_: Thinking, think/medium

**Skill**:
Reusable guidance or behavior the agent can apply inside a Project or Thread.
_Avoid_: Extension, plugin

**Project Skill**:
A Skill available by default inside a Project.
_Avoid_: Active thread instruction

**Thread Skill**:
A Skill actively applied to a specific Thread.
_Avoid_: Project-wide default

**Extension**:
An installed capability or integration package that adds commands, UI, or runtime behavior.
_Avoid_: Skill

**Project Extension**:
An installed Extension enabled and configured for one Project.
_Avoid_: Global-only integration

**Worktree**:
A linked working copy used as an execution environment for a Project.
_Avoid_: Project, workspace tab

**Answer**:
A saved response to a guided planning question.
_Avoid_: Memory

**Answer Revision**:
A preserved correction or edit to a saved Answer.
_Avoid_: Overwritten answer, silent context change

**High-Impact Answer**:
An Answer that may change scope, risk, requirements, workflow policy, model/reasoning settings, Worktree, or Ship readiness.
_Avoid_: Routine context answer

**Project Context**:
The visible saved planning information that informs a Plan.
_Avoid_: Memory, hidden context

**Project Context Section**:
A canonical section inside Project Context: Outcome, Users, Value, Constraints, Anti-goals, Requirements, Risks, Decisions, or Open Questions.
_Avoid_: Freeform memory bucket

**Open Question**:
A visible planning uncertainty that may affect readiness or scope.
_Avoid_: Backlog item, hidden uncertainty

**Decision**:
A first-class recorded choice that affects architecture, workflow, scope, model selection, or shipping risk.
_Avoid_: Casual note, mandatory ADR

**Risk**:
A first-class actionable concern that can affect execution, verification, or shipping.
_Avoid_: General worry, hidden blocker

**Requirement**:
A first-class testable requirement that can drive Slices and Acceptance Checks.
_Avoid_: Loose requirement note, implementation task

**Requirement Status**:
The lifecycle state of a Requirement: draft, ready, covered, verified, changed, or dropped.
_Avoid_: Generic task status

**Context Provenance**:
The recorded source of a Project Context entry: guided answer, manual edit, thread highlight, plan change, or import.
_Avoid_: Unattributed memory

**Thread Transcript**:
The preserved message and activity history of a Thread.
_Avoid_: Memory

**Environment Change**:
A recorded change to the Worktree or execution environment used by a Thread.
_Avoid_: Silent context switch

**Composer Context Row**:
The compact composer area showing current Model, Reasoning, Worktree/environment, and mode.
_Avoid_: Full settings panel, hidden execution context

**Composer Mode**:
The interaction style for the next message, such as Ask, Plan, Execute, or Review.
_Avoid_: Workflow Stage, Thread Purpose, source-of-truth state

**Ad Hoc Task**:
An explicit unplanned execution request not currently attached to a Slice.
_Avoid_: Hidden plan work

## Relationships

- A **Project** owns Plans, Threads, Backlog, Skills, Extensions, and Project Preferences.
- A **Project Overview** belongs to exactly one **Project**.
- A **Project Overview** summarizes active Plan state, open Plan Changes, parked Backlog items, recent Threads, worktrees, settings health, blockers, and next actions.
- A **Project Overview** shows unresolved **Ad Hoc Tasks** that need filing or reconciliation.
- Completed or reconciled **Ad Hoc Tasks** stay in the relevant **Thread Transcript** unless they created Plan, Backlog, or Risk records.
- A **Project Overview** shows the latest **Ship Handoff** summary when one exists.
- Full **Ship Handoff** history belongs under Plans or a dedicated history panel.
- **Project Overview** shows compact workflow status, not the full **Stage Strip**.
- The full **Stage Strip** belongs in **Plans Page** and **Guided Plan Mode**.
- A **Project Overview** is attention-first; full Thread history belongs on the Threads page.
- A new **Project** opens to **Project Overview**.
- If a new **Project** has no **Current Plan** or **Project Context**, **Project Overview** should offer Start guided plan as the primary action.
- Starting the guided plan is encouraged but not required.
- A **Workspace** backs exactly one visible **Project** surface in the desktop app.
- Primary UI should say **Project**, not Workspace.
- Workspace may appear only in technical settings/help when referring to filesystem-backed roots or worktree environments.
- A linked worktree is a **Workspace** implementation detail, not a separate user-facing **Project** unless explicitly opened as one.
- A **Thread** belongs to exactly one **Project**.
- A **Thread** has one **Thread Purpose**.
- A **Thread Purpose** helps route work and organize the sidebar without replacing Workflow Stage.
- A **Thread Purpose** may differ from the current **Workflow Stage** of the related Plan.
- **Threads Page** groups Threads by attention: Active, Follow-ups, Recent, and Archived.
- **Thread Purpose** appears as metadata or a filter, not the primary grouping.
- An **Archived Thread** remains visible through the Archived section or filter on the **Threads Page**.
- **Archived Threads** do not appear in Project Overview or active sidebar lists by default.
- A **Session** backs exactly one user-facing **Thread**.
- Primary UI should say **Thread**, not Session.
- Session may appear only in implementation names or low-level diagnostics.
- A Backlog item may create a follow-up **Thread** while preserving the source **Thread** unchanged.
- A **Thread** can attach to a **Plan Change** as the discussion or research trail for that proposed scope change.
- A **Backlog** item has one **Backlog Category**.
- A **Backlog** item has one **Backlog Status**.
- A **Backlog Category** helps Project Overview surface useful follow-ups without turning Backlog into the active Plan.
- **Backlog Category** describes what the item is; **Backlog Status** describes what happened to it.
- A **Backlog** item created from highlighted text preserves its source Thread, message/activity id, selected text, and optional surrounding context.
- Starting a **Thread** from a **Backlog** item moves the item to Backlog Status `in discussion`.
- A **Backlog** item in discussion links to the follow-up **Thread**.
- If the follow-up **Thread** produces a **Plan Change**, the **Backlog** item moves to Backlog Status `promoted`.
- **Park for Later** creates a Backlog item or Open Question, depending on whether the saved content is a follow-up or planning uncertainty.
- **Park for Later** may suggest Backlog item or Open Question automatically, but the user confirms or edits the destination before saving.
- Planning uncertainty should suggest **Open Question**; future ideas, tasks, or follow-ups should suggest **Backlog**.
- **Park for Later** is visually secondary to **Save Answer**.
- **Save Answer** advances to the next guided question by default.
- Guided question primary button text stays **Save Answer**.
- Stage transition buttons use specific next actions such as Start Research, Create Plan, Start Execute, Verify Work, or Prepare Ship.
- After **Save Answer**, the UI should briefly show saved state and provide undo or edit.
- High-impact answers may route to confirm or refine instead of blind auto-advance.
- A **High-Impact Answer** triggers confirm or refine before it changes execution behavior or release decisions.
- A **High-Impact Answer** does not automatically create a **Plan Change**.
- A **High-Impact Answer** may route to Plan Change, Project Preferences, Risk, Requirement, or Worktree updates depending on what it affects.
- Backlog Status `done` means the follow-up was resolved or completed.
- Backlog Status `dismissed` means the user intentionally chose not to pursue the item.
- A **Backlog** item does not affect a **Plan** until the user explicitly promotes it.
- A **Backlog** item does not silently become hidden memory for future Threads.
- A **Plan** belongs to exactly one **Project**.
- A **Project** has one **Current Plan** by default.
- A **Current Plan** is the primary execution story for the Project.
- Multiple parallel initiatives should become separate Projects or explicit future Plan lanes, not accidental competing active Plans.
- **Plan Lane** is a future concept and should not be implemented in the current model.
- **Plans Page** shows the active or current Plan first.
- Completed or shipped Plans appear in a collapsed or secondary history section.
- **Plans Page** does not include Project Preferences summaries or controls.
- **Plans Page** may show compact execution-context indicators such as using project defaults or overrides active, linked to **Project Preferences**.
- **Guided Plan Mode** lives inside the **Plans Page**.
- **Project Overview** can launch **Guided Plan Mode**, but does not own it.
- **Guided Plan Mode** starts with conversational, project-centered copy.
- Preferred guided plan headline: "Let's shape the plan for {project}."
- Preferred guided plan support copy: "Answer a few focused questions so GSD can turn your goals, constraints, and risks into a plan you can execute."
- **Guided Plan Mode** uses **Question Frames** for each **Workflow Stage**.
- **Question Frames** are database-backed definitions.
- A **Question Frame** records **Question Frame Source** for provenance.
- Prompt files can seed or version **Question Frames**, but are not the runtime source of truth.
- **Question Frames** are global reusable definitions by default.
- A **Plan** stores a **Question Frame Snapshot** for the frame versions used by that Plan.
- **Question Frame Snapshot** preserves question meaning after global **Question Frames** evolve.
- Projects do not customize **Question Frames** in the first implementation pass.
- Project-specific guided behavior should come from **Project Context** adaptation, not custom Question Frame authoring.
- Guided questions adapt to existing **Project Context** and should not duplicate already answered context.
- When relevant context already exists, **Guided Plan Mode** should confirm, refine, or skip instead of re-asking.
- **Question Frame** and prompt/template provenance are implementation/history language, not primary user-facing labels.
- Guided question UI should show the question, why it matters, and what will be saved.
- Guided questions should include short, user-friendly purpose text.
- Guided questions should show a clear saved-destination hint such as which Project Context Section or Requirement will be updated.
- Guided answer fields should use contextual labels based on destination, such as What we'll remember, Requirement note, Risk note, Decision, or Open question.
- "Your answer" is a fallback label only.
- A **Plan** is database-backed; generated markdown is a **Projection**.
- A **Projection** can be stale, repaired, or imported as legacy reference without replacing the **Plan** as source of truth.
- **Projections** are read-only by default in the app.
- **Generated Files** are shown as secondary output metadata, not primary guided-question content.
- Primary UI should not say Artifact.
- User-facing UI should say **Generated File** or Output; developer/history surfaces may say **Projection** when precision matters.
- Editing or importing markdown uses an **Import Flow** that proposes changes back into database-backed state.
- An **Import Flow** can propose **Project Context** updates and/or **Plan Changes**.
- Imported requirements or context become proposed **Project Context** updates.
- Imported **Project Context** updates require user review before applying.
- Users can accept all, edit individual imported context entries, or discard imported context entries.
- Imported Milestone, Slice, or Task edits become **Plan Changes**.
- An **Import Flow** previews affected database-backed objects before applying anything.
- A promoted **Backlog** item becomes a **Plan Change** before it can alter a **Plan**.
- A **Plan Change** can be accepted, edited, discarded, or sent back to Backlog.
- A **Plan Change** has one **Plan Change Status**.
- A **Plan Change** has its own status, source, proposed edits, affected Milestones/Slices/Tasks, and review history.
- A **Plan Change** is not just an inline state on a **Backlog** item.
- The agent may draft a **Plan Change**.
- A **Plan Change** does not affect the **Plan** until the user explicitly accepts it.
- Accepting a **Plan Change** creates a new **Plan Revision**.
- A **Plan** displays the latest accepted **Plan Revision** by default.
- **Plan Revision** history preserves what changed and why without relying on markdown as the audit trail.
- The current **Plan Revision** is shown subtly in the Plan header.
- Full **Plan Revision** history belongs in a dedicated history panel.
- A **Plan** moves through **Workflow Stages**.
- **Workflow** refers to the GSD process, not generic app automation.
- **Workflow Stage** labels use title case in normal prose and UI labels.
- Uppercase stage labels are reserved for compact badges or visual treatment.
- A **Workflow Stage** can be completed, active, queued, blocked, or skipped.
- A **Skipped Stage** records why that stage was not needed.
- A required guided question can become a **Skipped Question**.
- A **Skipped Question** records why the answer was not needed now.
- A **Skipped Question** creates or suggests an **Open Question** only when the skip reason is unknown, undecided, or needs later resolution.
- A **Skipped Question** with a not-applicable reason does not create an **Open Question** by default.
- Guided questions have a **Question State**.
- Guided questions can be required or **Optional Questions**.
- **Optional Questions** should be used sparingly and labeled clearly.
- **Question State** `needs review` can be set manually by the user.
- **Question State** `needs review` can be set automatically when derived Project Context changes, the Question Frame version changes, a related Plan Change is rejected, or imported context conflicts with the saved Answer.
- Required questions with **Question State** `needs review` block **Stage Readiness**.
- Optional questions with **Question State** `needs review` remain visible but do not block **Stage Readiness**.
- Users can navigate backward in **Guided Plan Mode**.
- Editing a previous Answer creates an **Answer Revision** and can update derived **Project Context**.
- **Stage Readiness** requires required Answers to be saved or skipped with reason, blockers acknowledged, and high-impact routes resolved.
- Stage transition buttons should be enabled only when **Stage Readiness** is satisfied or the user explicitly skips with reason.
- **Guided Progress** emphasizes **Workflow Stage** completion first.
- **Guided Progress** may show question count as secondary detail.
- Stage progress reflects required questions answered/skipped, blockers resolved, and high-impact routes resolved.
- **Stage Strip** remains available on small windows.
- On small windows, **Stage Strip** may collapse to current stage plus next stage with full strip accessible by horizontal scroll or dropdown.
- **Ship** requires verification evidence or **Risk Acceptance**.
- **Risk Acceptance** records the known gap and why proceeding is acceptable.
- **Risk Acceptance** usually links to an existing **Risk** or creates one.
- **Verification Evidence** includes a named check, status, command or manual method, timestamp, target surface, and result summary.
- **Verification Evidence** can come from automated tests, manual workflow checks, screenshots, Electron smoke tests, or other explicit checks.
- **Verification Evidence** attaches to the smallest meaningful work item, usually a Task or Slice.
- Milestone and Plan verification status roll up from attached **Verification Evidence**.
- **Ship** creates a **Ship Handoff**.
- A **Ship Handoff** includes shipped revision, completed Milestones/Slices, verification summary, unresolved Risks, accepted Risks, Projection links, and next follow-ups.
- The system can generate a draft **Ship Handoff** from Plan state, Verification Evidence, Risks, and follow-ups.
- The user reviews or edits the **Ship Handoff** before Ship is marked complete.
- A **Ship Handoff** can propose Backlog items from unresolved Risks, optional or stretch Slices, and Open Questions.
- Proposed Backlog items from a **Ship Handoff** require user review before creation.
- A **Plan** is structured by default as Milestones, Slices, and Tasks.
- A **Phase** may optionally group work inside a large **Plan**; it is not required for every Plan.
- A **Milestone** contains one or more **Slices**.
- **Milestone** completion is derived from required **Slice** status by default.
- A **Milestone** may have a manual override only for explicit edge cases.
- A **Slice** contains one or more **Tasks**.
- A **Slice** has a **Slice Scope**: required, optional, or stretch.
- A **Slice Scope** is not the same as **Priority**.
- **Priority** controls work ordering; **Slice Scope** controls whether a Slice gates Milestone completion.
- **Milestone** completion depends on required **Slices** unless the release target changes.
- A **Plan** can have multiple **Active Slices**.
- A **Plan** has at most one **Current Slice** per user focus context.
- **Current Slice** is the focused Slice; **Active Slices** are all in-progress Slices across Threads or Worktrees.
- **Current Slice** belongs to a Thread or user focus context, not globally to the Project.
- **Project Overview** may recommend a next Slice without changing any Thread's **Current Slice**.
- A **Slice** has an **Acceptance Check** before it can be marked done.
- An **Acceptance Check** defines the expected outcome; **Verification Evidence** records whether it was checked and what happened.
- A **Task** should produce execution evidence before verification.
- **Tasks** are visible but secondary in the UI.
- The main Plan view emphasizes Milestones and Slices; Tasks expand for execution detail, evidence, or debugging.
- **Execute** normally runs a **Slice** and tracks its underlying Tasks.
- A **Slice** is the user-meaningful execution unit; Tasks are the implementation checklist.
- A model chosen for Verify applies to the Verify **Workflow Stage**, not to a work-breakdown **Phase**.
- **Settings** provide defaults for all Projects.
- **Settings** expose **App Defaults**.
- **Project Preferences** override **Settings** for exactly one Project.
- Default inheritance is **App Defaults** → **Project Preferences** → Thread/Slice overrides.
- **Project Preferences** cover behavior defaults such as models, reasoning, workflow policy, and default Worktree.
- Changes to **Settings** or **Project Preferences** create **Preference Change** records.
- A **Preference Change** records who/when/from/to/reason when available.
- **Project Preferences** uses transient save feedback instead of a persistent Saved badge.
- **Project Preferences** may show current values and last changed information when useful.
- **Settings** and **Project Preferences** should use the same Model and Reasoning controls with different scope labels.
- **Settings** labels defaults as **App Defaults**; **Project Preferences** labels overrides as this Project.
- **Project Skills Page** manages Skills for one Project.
- **Project Extensions Page** manages Extensions for one Project.
- **Project Navigation** order is Project Overview, Threads, Plans, Backlog, Worktrees, Skills, Extensions, Project Preferences.
- **Project Navigation** uses the same core order in every Project and workspace tab.
- **Sidebar Collapse Control** belongs to **Project Navigation**.
- **Sidebar Collapse Control** should live in the project sidebar footer or edge and must not overlap project item actions.
- Sidebar collapse state is per window, not per Project.
- Sidebar collapse state should not be stored as Project data.
- **Global Navigation** stays minimal: workspace tabs, new/open Project, Search, and Settings.
- Project pages belong in **Project Navigation**, not **Global Navigation**.
- Global **Settings** lives in **Global Navigation**.
- **Project Preferences** lives in **Project Navigation** for each Project.
- Settings and Project Preferences may share visual placement patterns, but their labels must make scope clear.
- **Toast Notifications** auto-dismiss by default.
- Persistent notices are reserved for errors, blocking actions, or decisions requiring user input.
- Saved confirmations such as saved to Backlog or preferences saved should auto-dismiss and remain recoverable through the relevant page state.
- User-facing copy uses **GSD** for the product/system.
- User-facing copy uses **Agent** only when describing an executing worker.
- A **Workspace Tab** represents one open **Project**.
- The app shell should show only one set of **Window Controls**.
- If native **Window Controls** are visible, the app should not render duplicate fake controls.
- Workspace tabs reserve safe spacing around **Window Controls**.
- **Theme Tokens** define both dark and light mode values.
- Dark mode may receive primary visual polish first, but light mode must remain readable and usable.
- Pages should use **Theme Tokens** instead of hard-coded page-specific colors.
- **GSD Dark Theme** applies across the whole app.
- Plans may use richer emphasis, but Skills, Extensions, Settings, Threads, and Project Overview should feel like the same product.
- Product vocabulary and hard product decisions stay in **CONTEXT.md**.
- Reusable theme and component implementation rules may later move into a **Design System Doc**.
- A **Design System Doc** should link back to **CONTEXT.md** to prevent terminology drift.
- Do not create the **Design System Doc** until the next UI implementation pass needs it.
- The **Design System Doc** should be derived from real tokens and components, not speculative design notes.
- **Threads** and Project pages are opened inside the active **Workspace Tab**, not as top-level tabs.
- A **Project** should open in only one **Workspace Tab** by default.
- Selecting an already-open **Project** focuses its existing **Workspace Tab**.
- A future split or forked view must be explicit, not a duplicate Project tab by accident.
- Search defaults to current **Project**.
- **Search Scope** can be expanded to All Projects explicitly.
- Search UI should make the active **Search Scope** obvious.
- **Inbox** is not part of the first-pass Project model.
- Add **Inbox** only when global cross-project notifications exist.
- A **Workflow Stage** model may come from **Settings** or from **Project Preferences**.
- A **Model** is displayed and stored as provider/model.
- Model controls are labeled neutrally as **Model**.
- **Reasoning** is a separate user-facing control from **Model**.
- Reasoning controls use natural labels such as low, medium, high, or maximum.
- **Reasoning** may be configured per **Workflow Stage**.
- **Settings** can provide default **Reasoning** per **Workflow Stage**.
- **Project Preferences** can override **Reasoning** per **Workflow Stage** for one Project.
- No single provider is treated as the default product concept in UI language.
- A **Skill** guides how GSD works inside a Project or Thread.
- A **Project Skill** is available or suggested for Threads in that Project.
- A **Thread Skill** is active only for the Thread where it is selected or invoked.
- Applying a **Thread Skill** does not automatically make it a **Project Skill**.
- An **Extension** adds capabilities to GSD through commands, UI, integrations, or runtime behavior.
- **Extensions** are installed at the app level.
- A **Project Extension** enables or configures an installed Extension for one Project.
- Installing an **Extension** does not automatically enable it for every Project.
- A **Worktree** belongs to one **Project**.
- A **Thread** can run against the Project's local environment or a linked **Worktree**.
- A **Worktree** does not create a separate user-facing **Project** unless the user explicitly opens it as one.
- A default **Worktree** can be set in **Project Preferences**.
- Execution chooses a **Worktree** at the Thread or Slice level.
- A Thread or Slice can override the Project default **Worktree** for parallel or isolated work.
- A **Thread** can switch Worktrees midstream.
- Worktree switches are recorded as an **Environment Change** in the **Thread Transcript**.
- The **Composer Context Row** shows current Thread/Slice overrides compactly.
- The **Composer Context Row** opens details when clicked instead of expanding into a full settings panel by default.
- **Composer Mode** describes what the next message should do.
- **Composer Mode** does not replace **Thread Purpose** or **Workflow Stage**.
- Composer Mode uses **Ask** for general messages; **Discuss** remains a **Workflow Stage**.
- Composer Mode **Plan** means the next message should help shape or update the Plan.
- Composer Mode **Plan** is distinct from the **Plan** domain object in implementation naming.
- Composer Mode **Review** routes based on target context.
- **Review** means code review when linked to code or diff context.
- **Review** means planning review when linked to a Plan Change, Plan Revision, Ship Handoff, Requirement, or similar planning object.
- Review UI should name the target, such as Review diff or Review plan change.
- Composer Mode **Execute** usually requires a **Current Slice**.
- If no **Current Slice** exists, **Execute** asks the user to select/create one or proceed as an **Ad Hoc Task**.
- **Ad Hoc Task** execution is explicit and should not silently become planned work.
- After an **Ad Hoc Task**, the app can offer to attach results to the Plan, create a **Plan Change**, or save Backlog items.
- Reconciling an **Ad Hoc Task** does not rewrite history to make it look planned from the beginning.
- An **Answer** belongs to a **Plan** and contributes to **Project Context**.
- An **Answer** is preserved as the original response for audit/history.
- An **Answer** preserves the exact question text, prompt/help text, user response, and Question Frame version shown at the time.
- Correcting an **Answer** creates an **Answer Revision**.
- An **Answer Revision** can update the normalized **Project Context** entry derived from the Answer.
- The original **Answer** remains available for audit/history.
- A saved **Answer** can create or update a normalized **Project Context** entry.
- **Project Context** is visible and reviewable; it is not hidden memory.
- Primary UI should not say Memory.
- UI should name the specific object: **Project Context**, **Backlog**, **Answer**, **Thread Transcript**, or saved source.
- **Project Context** can be edited directly by the user.
- **Project Context** is organized by **Project Context Sections**.
- Guided Answers and imports map into **Project Context Sections**.
- **Open Questions** live in **Project Context**.
- An **Open Question** may create a Backlog item or Thread, but it is not the same as Backlog.
- Important unresolved **Open Questions** can block planning readiness.
- Small decisions can live as notes in the Decisions **Project Context Section**.
- Important decisions become first-class **Decision** records.
- A **Decision** records the choice, rationale, alternatives, date, and linked Threads or Plan Changes.
- General worries can live as notes in the Risks **Project Context Section**.
- Actionable risks become first-class **Risk** records.
- A **Risk** records impact, likelihood, mitigation, owner/status, and links to Slices, Verification Evidence, or Risk Acceptance.
- High-level requirement notes can live in the Requirements **Project Context Section**.
- Testable requirements that affect execution become first-class **Requirement** records.
- A **Requirement** can link to Slices and Acceptance Checks.
- A **Requirement** has one **Requirement Status**.
- Requirement Status `covered` means the Requirement is linked to planned work.
- Requirement Status `verified` means **Verification Evidence** exists.
- A **Project Context** edit records **Context Provenance**.
- A **Thread Transcript** belongs to one **Thread** and can be the source for a Backlog item.

## Example dialogue

> **Dev:** "Should the sidebar say Workspace Preferences?"
> **Domain expert:** "No — users are configuring the Project. Workspace stays in the implementation vocabulary."
>
> **Dev:** "Should UI copy say workspace?"
> **Domain expert:** "Avoid it in primary UI. Use Project unless the copy is specifically technical."
>
> **Dev:** "When a user saves selected text for later, do we move it out of the Thread?"
> **Domain expert:** "No — the Thread stays intact. The saved item can start a new follow-up Thread from Backlog."
>
> **Dev:** "Should UI copy say New session?"
> **Domain expert:** "No — use New Thread. Session is implementation language."
>
> **Dev:** "Can a Thread just be generic chat?"
> **Domain expert:** "It can feel casual, but it still has a lightweight purpose so the Project can organize and route it."
>
> **Dev:** "If the Plan is in Plan, can a linked Thread be for research?"
> **Domain expert:** "Yes — Workflow Stage describes where the Plan is; Thread Purpose describes why the Thread exists."
>
> **Dev:** "Should Threads be grouped by purpose first?"
> **Domain expert:** "No — group by attention. Purpose is useful as a badge or filter."
>
> **Dev:** "Do Archived Threads disappear?"
> **Domain expert:** "No — they stay recoverable from Threads, but leave active surfaces."
>
> **Dev:** "If the user saves feature idea #2 for later, should the current Plan change?"
> **Domain expert:** "No — it sits in Backlog until the user starts a Thread from it or promotes it into the Plan."
>
> **Dev:** "Is every Backlog item a task?"
> **Domain expert:** "No — Backlog items can be ideas, questions, bugs, risks, follow-ups, decisions, or tasks."
>
> **Dev:** "Does Backlog need status?"
> **Domain expert:** "Yes — keep status small: open, in discussion, promoted, dismissed, or done."
>
> **Dev:** "What happens when Backlog starts a follow-up Thread?"
> **Domain expert:** "The item moves to in discussion and links to that Thread."
>
> **Dev:** "Should Park for Later sit beside Save Answer as an equal action?"
> **Domain expert:** "No — Save Answer is primary. Park for Later is secondary and creates Backlog or Open Question context."
>
> **Dev:** "Should Park for Later auto-decide where content goes?"
> **Domain expert:** "It can suggest Backlog or Open Question, but the user confirms the destination."
>
> **Dev:** "Should Save Answer advance automatically?"
> **Domain expert:** "Yes by default, with a brief saved state and undo/edit."
>
> **Dev:** "Should Save Answer text change by question?"
> **Domain expert:** "No — keep Save Answer stable. Use stage-specific labels for transition buttons."
>
> **Dev:** "What makes an Answer high-impact?"
> **Domain expert:** "It changes scope, risk, requirements, workflow policy, model/reasoning settings, Worktree, or Ship readiness."
>
> **Dev:** "Does every high-impact Answer create a Plan Change?"
> **Domain expert:** "No — it routes to the affected object, such as Plan Change, Risk, Requirement, Preferences, or Worktree."
>
> **Dev:** "Do Backlog items need both done and dismissed?"
> **Domain expert:** "Yes — done means handled; dismissed means intentionally not pursued."
>
> **Dev:** "If a user saves highlighted text, should Backlog remember where it came from?"
> **Domain expert:** "Yes — save the source Thread, exact selected text, and enough context to recover why it mattered."
>
> **Dev:** "When a Backlog item is promoted, should the Plan update immediately?"
> **Domain expert:** "No — promotion creates a Plan Change first. The user reviews it before scope changes."
>
> **Dev:** "Is a Plan Change just a Backlog item marked ready?"
> **Domain expert:** "No — it is its own object with status, affected work, and review history."
>
> **Dev:** "Where does the discussion about a Plan Change live?"
> **Domain expert:** "In a linked Thread, so the conversation and research trail stays attached to the scope decision."
>
> **Dev:** "When a Plan Change is accepted, do we overwrite the Plan?"
> **Domain expert:** "No — accepting it creates a new Plan Revision so users can inspect what changed and why."
>
> **Dev:** "Should revision history dominate the Plan page?"
> **Domain expert:** "No — show the current revision in the header and keep full history in a dedicated panel."
>
> **Dev:** "Should a Plan Change be marked done?"
> **Domain expert:** "No — use draft, ready for review, accepted, rejected, or superseded."
>
> **Dev:** "Can the agent change the Plan automatically?"
> **Domain expert:** "No — the agent can draft a Plan Change, but the user accepts it before the Plan changes."
>
> **Dev:** "If someone edits `.gsd/REQUIREMENTS.md`, did the Plan change?"
> **Domain expert:** "Not by itself. Markdown is a Projection; the Plan changes only when database-backed planning state changes."
>
> **Dev:** "Should Plans show only the active Plan?"
> **Domain expert:** "Show the active Plan first, with completed or shipped Plans in a secondary history section."
>
> **Dev:** "Should Plans include Project Preferences?"
> **Domain expert:** "No — show only compact context indicators that link to Project Preferences."
>
> **Dev:** "Can a Project have several active Plans?"
> **Domain expert:** "Not by default — a Project has one Current Plan unless a future explicit plan-lane concept is introduced."
>
> **Dev:** "Is the guided wizard its own page?"
> **Domain expert:** "No — it is Guided Plan Mode inside Plans."
>
> **Dev:** "Should the first guided screen say Build a plan?"
> **Domain expert:** "Use friendlier copy: Let's shape the plan for {project}."
>
> **Dev:** "Should guided questions be fixed every time?"
> **Domain expert:** "No — use Question Frames, but adapt to Project Context so the user is not asked the same thing twice."
>
> **Dev:** "Do Question Frames live in prompt files?"
> **Domain expert:** "No — they are database-backed definitions with prompt-file provenance."
>
> **Dev:** "If global Question Frames change, what happens to old Plans?"
> **Domain expert:** "Old Plans keep a Question Frame Snapshot so their Answers remain understandable."
>
> **Dev:** "Can Projects define custom Question Frames now?"
> **Domain expert:** "No — keep Question Frames global for now. Projects adapt through Project Context."
>
> **Dev:** "Should the UI say Prompt Frame?"
> **Domain expert:** "No — show natural guided-question wording. Keep prompt provenance in metadata or history."
>
> **Dev:** "Should guided questions explain why they matter?"
> **Domain expert:** "Yes — use one short purpose sentence and a clear saved-destination hint."
>
> **Dev:** "Should the answer field always say Your answer?"
> **Domain expert:** "No — use contextual labels that describe what the answer will become."
>
> **Dev:** "Should we build Plan lanes now?"
> **Domain expert:** "No — keep one Current Plan per Project and treat Plan Lane as a future concept."
>
> **Dev:** "Should generated Markdown be editable like the source of truth?"
> **Domain expert:** "No — edit database-backed Plan and Context in the UI. Markdown imports become proposed changes."
>
> **Dev:** "Should `.gsd/REQUIREMENTS.md` be prominent in the wizard?"
> **Domain expert:** "No — show generated file paths as secondary output metadata, not primary guidance."
>
> **Dev:** "Should UI copy say Artifact?"
> **Domain expert:** "No — use Generated File or Output in user-facing screens."
>
> **Dev:** "Does imported Markdown always become a Plan Change?"
> **Domain expert:** "No — context imports update Project Context; work-structure imports create Plan Changes."
>
> **Dev:** "Can imported context apply silently?"
> **Domain expert:** "No — imported context is reviewed before it updates Project Context."
>
> **Dev:** "Should we call the Verify model a phase model?"
> **Domain expert:** "No — Verify is a Workflow Stage. Phase is reserved for the Plan's work breakdown."
>
> **Dev:** "Should generic pages be called Workflows?"
> **Domain expert:** "No — Workflow means the GSD process from Discuss through Ship."
>
> **Dev:** "Should stage labels always be uppercase?"
> **Domain expert:** "No — use title case normally; reserve uppercase for compact badges."
>
> **Dev:** "Does every Plan need Research before planning?"
> **Domain expert:** "No — Research can be skipped, but the Plan should record why it was safe to skip."
>
> **Dev:** "Can the user move stages with unanswered required questions?"
> **Domain expert:** "Only if they explicitly skip with reason and resolve blockers/high-impact routes."
>
> **Dev:** "Should progress be 4 of 12 questions?"
> **Domain expert:** "Use stage completion as the main progress story; question count is secondary."
>
> **Dev:** "Can the stage strip disappear on small windows?"
> **Domain expert:** "No — compact it, but keep the user's place in Discuss through Ship visible."
>
> **Dev:** "Can only stages be skipped with reason?"
> **Domain expert:** "No — individual required questions can also be skipped with reason."
>
> **Dev:** "Does every skipped question become an Open Question?"
> **Domain expert:** "No — only unknown, undecided, or later-resolution skips become or suggest Open Questions."
>
> **Dev:** "Can users go back and edit prior guided answers?"
> **Domain expert:** "Yes — question state should support answered, skipped, needs review, and current."
>
> **Dev:** "Who sets needs review?"
> **Domain expert:** "Both user and system can. The system sets it when context or source assumptions change."
>
> **Dev:** "Does needs review block the stage?"
> **Domain expert:** "For required questions, yes. For optional questions, no."
>
> **Dev:** "Should optional questions exist?"
> **Domain expert:** "Yes, sparingly. They enrich planning but do not block readiness."
>
> **Dev:** "Can Ship happen without Verify?"
> **Domain expert:** "Only with explicit Risk Acceptance. Otherwise Ship needs verification evidence."
>
> **Dev:** "Can Risk Acceptance be a loose note?"
> **Domain expert:** "Usually no — it should link to an existing Risk or create one."
>
> **Dev:** "What counts as verification evidence?"
> **Domain expert:** "A concrete check with method, target, status, timestamp, and result summary."
>
> **Dev:** "Should evidence attach only to the whole Plan?"
> **Domain expert:** "No — attach it to the smallest meaningful Task or Slice, then roll status up to Milestones and the Plan."
>
> **Dev:** "Does Ship just mark the Plan complete?"
> **Domain expert:** "No — Ship creates a Ship Handoff with revision, evidence, risks, projections, and follow-ups."
>
> **Dev:** "Who writes the Ship Handoff?"
> **Domain expert:** "The system drafts it from recorded evidence and follow-ups; the user reviews it before Ship completes."
>
> **Dev:** "Should Ship automatically create follow-up Backlog items?"
> **Domain expert:** "It can propose them, but the user reviews them before they are created."
>
> **Dev:** "Does every small Plan need a Phase?"
> **Domain expert:** "No — default to Milestone, Slice, Task. Add Phase only when a larger Plan needs that grouping."
>
> **Dev:** "Should users execute individual Tasks or a whole Slice?"
> **Domain expert:** "Normally execute the Slice. Tasks track the checklist underneath it."
>
> **Dev:** "Should the Plan feel like a task manager?"
> **Domain expert:** "No — keep Milestones and Slices primary. Tasks are visible when detail is needed."
>
> **Dev:** "Should users manually mark Milestones complete?"
> **Domain expert:** "Usually no — Milestone status rolls up from required Slices, with manual override only for edge cases."
>
> **Dev:** "Does every Slice block Milestone completion?"
> **Domain expert:** "No — only required Slices block completion unless the release target changes."
>
> **Dev:** "Is Slice Scope just priority?"
> **Domain expert:** "No — Scope controls whether it gates completion; Priority controls what to work on first."
>
> **Dev:** "Can more than one Slice be active at once?"
> **Domain expert:** "Yes — multiple Slices can be active, but the UI should still identify the Current Slice."
>
> **Dev:** "Is Current Slice global to the Project?"
> **Domain expert:** "No — it belongs to the Thread or user focus context so parallel work does not steal focus."
>
> **Dev:** "Can a Slice be done without a user-facing acceptance check?"
> **Domain expert:** "No — each Slice needs a short acceptance check so done means something beyond completed tasks."
>
> **Dev:** "Are acceptance checks and verification evidence the same thing?"
> **Domain expert:** "No — the acceptance check is the target; verification evidence is the receipt."
>
> **Dev:** "Should Home open a blank chat?"
> **Domain expert:** "No — Home is the Project Overview. Threads are opened from the Threads area or quick actions."
>
> **Dev:** "Should a new Project force users into the wizard?"
> **Domain expert:** "No — open Project Overview and make Start guided plan the clear primary action."
>
> **Dev:** "Should Project Overview show every Thread?"
> **Domain expert:** "No — it should show what needs attention. Full Thread history belongs on the Threads page."
>
> **Dev:** "Should Project Overview show ad hoc work?"
> **Domain expert:** "Only if it is unresolved and needs filing or reconciliation."
>
> **Dev:** "Should Project Overview show every Ship Handoff?"
> **Domain expert:** "No — show the latest summary and link to history."
>
> **Dev:** "Should Project Overview use the full Stage Strip?"
> **Domain expert:** "No — show compact workflow status and link into Plans."
>
> **Dev:** "Where does brightpath set a different Verify model?"
> **Domain expert:** "Project Preferences. Settings holds the default for every Project; brightpath can override it."
>
> **Dev:** "Do Project Preference changes need history?"
> **Domain expert:** "Yes — lightly record who/when/from/to/reason because preferences affect execution."
>
> **Dev:** "Should Project Preferences keep showing Saved forever?"
> **Domain expert:** "No — use transient save feedback, then let current values speak for themselves."
>
> **Dev:** "Should Settings and Project Preferences use different model controls?"
> **Domain expert:** "No — use the same controls with different scope labels."
>
> **Dev:** "Should Settings say Team defaults?"
> **Domain expert:** "No — use App Defaults until team or org scope exists."
>
> **Dev:** "Should Project Preferences contain Skills and Extensions too?"
> **Domain expert:** "No — Preferences are for behavior defaults. Skills and Extensions get their own Project pages."
>
> **Dev:** "What order should the Project sidebar use?"
> **Domain expert:** "Project Overview, Threads, Plans, Backlog, Worktrees, Skills, Extensions, Project Preferences."
>
> **Dev:** "Should the collapse button sit in the top workspace tabs?"
> **Domain expert:** "No — it controls Project Navigation, so it belongs in the project sidebar."
>
> **Dev:** "Is sidebar collapsed state Project data?"
> **Domain expert:** "No — it is a per-window layout preference."
>
> **Dev:** "Can each Project customize the sidebar order?"
> **Domain expert:** "No — keep the core Project Navigation order identical across Projects and workspace tabs."
>
> **Dev:** "Should global navigation contain Home, Inbox, Workflows, and project pages?"
> **Domain expert:** "No — keep Global Navigation minimal and put project work inside Project Navigation."
>
> **Dev:** "Should Settings appear inside each Project?"
> **Domain expert:** "No — global Settings stays global. Each Project has Project Preferences."
>
> **Dev:** "Should saved to Backlog stay on screen?"
> **Domain expert:** "No — use an auto-dismissing Toast Notification unless the user needs to act."
>
> **Dev:** "Should copy say GSD or the agent?"
> **Domain expert:** "Use GSD for the product/system and agent only for an executing worker."
>
> **Dev:** "Should top tabs open Threads too?"
> **Domain expert:** "No — top tabs are Projects. Threads and pages live inside the active Project tab."
>
> **Dev:** "Can the app render its own window controls too?"
> **Domain expert:** "Only if native controls are hidden. Never show duplicate window controls."
>
> **Dev:** "Can we only design dark mode for now?"
> **Domain expert:** "Dark can get the polish, but Theme Tokens must support readable light mode too."
>
> **Dev:** "Is the purple/blue look only for Plans?"
> **Domain expert:** "No — make it the GSD Dark Theme across the product."
>
> **Dev:** "Should design decisions live in CONTEXT.md forever?"
> **Domain expert:** "Keep product decisions there now; split reusable theme/component rules into a Design System Doc when implementation needs it."
>
> **Dev:** "Should we create the Design System Doc now?"
> **Domain expert:** "No — create it during the next UI implementation pass from real tokens and components."
>
> **Dev:** "Can the same Project open in multiple top tabs?"
> **Domain expert:** "Not by default — selecting an already-open Project focuses its existing Workspace Tab."
>
> **Dev:** "Should Search be global by default?"
> **Domain expert:** "No — default to the current Project, with explicit All Projects scope."
>
> **Dev:** "Should Inbox exist now?"
> **Domain expert:** "No — wait until there is a real cross-project notification model."
>
> **Dev:** "Should the UI show vendor names or hide them?"
> **Domain expert:** "Show precise provider/model values, but label the control neutrally as Model."
>
> **Dev:** "Should the UI say think/medium?"
> **Domain expert:** "No — use Reasoning as the control label. Model chooses the engine; Reasoning chooses deliberation."
>
> **Dev:** "Is Reasoning just one global setting?"
> **Domain expert:** "No — it can be configured per Workflow Stage, with Project Preferences overriding Settings."
>
> **Dev:** "Is `ui-ux-pro-max` an Extension?"
> **Domain expert:** "No — it is a Skill because it guides how GSD approaches design work."
>
> **Dev:** "If a user invokes a Skill in one Thread, should every future Thread inherit it?"
> **Domain expert:** "No — that is a Thread Skill unless the user explicitly adds it as a Project Skill."
>
> **Dev:** "If an Extension is installed, is it active in every Project?"
> **Domain expert:** "No — installed Extensions are app-level, but each Project chooses which ones are enabled and configured."
>
> **Dev:** "If a Thread runs in a feature worktree, does it move to another Project?"
> **Domain expert:** "No — the Thread still belongs to the Project. The Worktree only changes the execution environment."
>
> **Dev:** "Where is the Worktree selected?"
> **Domain expert:** "Project Preferences can set the default, but a Thread or Slice execution can choose a different Worktree."
>
> **Dev:** "Can a Thread switch Worktrees after it starts?"
> **Domain expert:** "Yes — but the Thread Transcript should record the environment change."
>
> **Dev:** "Should Thread/Slice overrides be hidden?"
> **Domain expert:** "No — show them compactly in the Composer Context Row and open details on click."
>
> **Dev:** "Does composer mode mean Workflow Stage?"
> **Domain expert:** "No — composer mode is an action hint for the next message, not stored Plan state."
>
> **Dev:** "Should the composer say Ask or Discuss?"
> **Domain expert:** "Use Ask in the composer. Discuss remains the Workflow Stage."
>
> **Dev:** "Is Plan both a mode and an entity?"
> **Domain expert:** "Yes, but implementation naming should distinguish composerMode=plan from the Plan entity."
>
> **Dev:** "Does Review mean code review or plan review?"
> **Domain expert:** "Both are valid; route by target context and label the target clearly."
>
> **Dev:** "Can Execute run without a Current Slice?"
> **Domain expert:** "Usually no — select or create a Slice, or explicitly run it as an Ad Hoc Task."
>
> **Dev:** "Can ad hoc work be attached to the Plan afterward?"
> **Domain expert:** "Yes — offer reconciliation, but keep the history honest that it started ad hoc."
>
> **Dev:** "Should the UI say this answer was added to memory?"
> **Domain expert:** "No — call it a saved Answer or Project Context. Memory is too vague."
>
> **Dev:** "Should UI copy ever say Memory?"
> **Domain expert:** "No — name the specific object instead."
>
> **Dev:** "When a guided question is answered, do we store the answer or only update context?"
> **Domain expert:** "Both — preserve the original Answer and use it to update editable Project Context."
>
> **Dev:** "Should an Answer save the exact question too?"
> **Domain expert:** "Yes — save the question text, help text, response, and Question Frame version."
>
> **Dev:** "Can users correct a saved Answer?"
> **Domain expert:** "Yes — corrections create Answer Revisions and update normalized Project Context without losing the original."
>
> **Dev:** "Can users edit Project Context directly?"
> **Domain expert:** "Yes — but every entry or edit should keep provenance so users can tell where it came from."
>
> **Dev:** "Should Project Context be just freeform notes?"
> **Domain expert:** "No — organize it into canonical sections like Outcome, Requirements, Risks, Decisions, and Open Questions."
>
> **Dev:** "Are Open Questions just Backlog?"
> **Domain expert:** "No — Open Questions are visible planning uncertainty. Backlog is follow-up storage."
>
> **Dev:** "Does every decision need a full ADR?"
> **Domain expert:** "No — important decisions become first-class Decision records; smaller notes can stay in Project Context."
>
> **Dev:** "Are Risks just notes?"
> **Domain expert:** "General worries can be notes, but actionable risks become Risk records linked to verification and ship decisions."
>
> **Dev:** "Are Requirements just a Project Context section?"
> **Domain expert:** "High-level notes can live there, but testable requirements become first-class Requirement records."
>
> **Dev:** "Does a planned Requirement count as verified?"
> **Domain expert:** "No — covered means planned work exists; verified means evidence exists."

## Flagged ambiguities

- "project" and "workspace" were used interchangeably in UI discussions — resolved: **Project** is user-facing language; **Workspace** is implementation language.
- "thread", "chat", and "session" were used interchangeably — resolved: **Thread** is user-facing language; **Session** is implementation language.
- "thread" could mean any unclassified conversation — resolved: each **Thread** has a lightweight **Thread Purpose**.
- "thread purpose" could be confused with workflow stage — resolved: **Workflow Stage** is Plan state; **Thread Purpose** is Thread intent, and they may differ.
- "threads page" could become taxonomy-heavy — resolved: group by attention, with **Thread Purpose** as metadata or filter.
- "archived thread" could mean deleted or hidden — resolved: **Archived Thread** remains recoverable from **Threads Page**.
- "backlog" and "memory" were used interchangeably — resolved: **Backlog** is explicit follow-up storage, not hidden planning memory.
- "backlog item" could imply task — resolved: each item has a **Backlog Category**.
- "backlog category" could be asked to carry lifecycle — resolved: **Backlog Category** describes type; **Backlog Status** describes lifecycle.
- "promote to plan" could imply immediate mutation — resolved: promotion creates a reviewable **Plan Change** before the **Plan** changes.
- "plan change" could be treated as a Backlog item state — resolved: **Plan Change** is first-class and has its own lifecycle.
- "plan change done" is too vague — resolved: use **Plan Change Status** outcomes.
- "agent-drafted change" could mutate scope automatically — resolved: agent may draft, but user acceptance is required.
- "accepted plan change" could overwrite prior state — resolved: accepted changes create a **Plan Revision**.
- "plan" was used to mean both the workflow state and generated markdown — resolved: **Plan** is database-backed work state; **Projection** is generated output.
- "plans page" could become only a task board or archive — resolved: **Plans Page** prioritizes the active Plan and keeps history secondary.
- "guided wizard" could become a separate onboarding surface — resolved: **Guided Plan Mode** belongs inside **Plans Page**.
- "guided questions" could duplicate known context — resolved: **Guided Plan Mode** adapts to **Project Context** and avoids re-asking.
- "question frame" could make prompt files the runtime source of truth — resolved: **Question Frames** are database-backed and keep **Question Frame Source** provenance.
- "question frame" could mutate old Plan history — resolved: each **Plan** keeps a **Question Frame Snapshot**.
- "project-specific question frames" could expand scope too early — resolved: not in first pass; adapt through **Project Context** instead.
- "prompt frame" could leak implementation language into UI — resolved: guided question UI uses natural wording and keeps provenance in metadata/history.
- "active plans" could compete in one Project — resolved: one **Current Plan** by default.
- "plan lanes" could expand current scope — resolved: **Plan Lane** is future-only for now.
- "projection" could become editable source of truth — resolved: **Projections** are read-only by default; edits go through **Import Flow**.
- "artifact path" could dominate guided planning — resolved: **Generated Files** are secondary output metadata.
- "phase" was used for both GSD workflow and plan structure — resolved: **Workflow Stage** is Discuss through Ship; **Phase** is only a work-breakdown term.
- "research" could be treated as mandatory ceremony — resolved: Research is a **Workflow Stage** that may be skipped with a reason.
- "ship" could happen after an implicit verify skip — resolved: **Ship** requires verification evidence or **Risk Acceptance**.
- "risk acceptance" could be a loose note — resolved: **Risk Acceptance** usually links to or creates a **Risk**.
- "verified" could be used without proof — resolved: **Verification Evidence** records what was checked and what happened.
- "phase" was also treated as required plan structure — resolved: **Phase** is optional; default Plan hierarchy is **Milestone** → **Slice** → **Task**.
- "milestone status" could drift if manual-only — resolved: **Milestone** completion derives from required **Slice** status by default.
- "slice" could imply every item blocks release — resolved: **Slice Scope** marks Slices as required, optional, or stretch.
- "slice scope" could be confused with priority — resolved: **Slice Scope** gates completion; **Priority** orders work.
- "active slice" could imply a single serial plan — resolved: a **Plan** can have multiple **Active Slices**, with one **Current Slice** per focus context.
- "current slice" could be treated as global project state — resolved: **Current Slice** belongs to a Thread or user focus context.
- "done" for a Slice could mean tasks finished — resolved: a **Slice** also needs an **Acceptance Check**.
- "acceptance check" and "verification evidence" could be blended — resolved: **Acceptance Check** is the target; **Verification Evidence** is the receipt.
- "home" was used as a generic landing surface — resolved: **Project Overview** is the Project's status and next-action page.
- "new project" could hard-lock users into the wizard — resolved: new Projects open to **Project Overview** with guided planning as the primary action.
- "project overview" could become another thread browser — resolved: **Project Overview** is attention-first; full history stays in **Threads**.
- "settings" and "project preferences" were blended — resolved: **Settings** are global defaults; **Project Preferences** are per-Project overrides.
- "preference change" could silently alter execution — resolved: **Preference Change** records changes to Settings and Project Preferences.
- "project preferences" could become a catch-all — resolved: Preferences are for behavior defaults; Skills and Extensions have separate Project pages.
- "sidebar order" could change by current page — resolved: **Project Navigation** has a stable order.
- "project navigation" could vary by Project — resolved: core **Project Navigation** order is identical everywhere.
- "global navigation" could drift into generic chat-app navigation — resolved: keep **Global Navigation** minimal.
- "workspace tab" could contain mixed concepts — resolved: **Workspace Tab** represents an open **Project** only.
- "open project" could duplicate tabs — resolved: opening an already-open **Project** focuses its existing **Workspace Tab**.
- "inbox" could become a miscellaneous bucket — resolved: **Inbox** is future-only until cross-project notifications exist.
- "model" could become vendor-branded language — resolved: label controls as **Model** and store/display values as provider/model.
- "thinking" could leak implementation wording into UI — resolved: user-facing UI says **Reasoning**.
- "reasoning" could be global-only — resolved: **Reasoning** can be stage-specific through Settings and Project Preferences.
- "skill" and "extension" were both used for capabilities — resolved: **Skill** is reusable guidance/behavior; **Extension** is an installed capability or integration package.
- "skill applied here" could become project-wide by accident — resolved: **Thread Skill** is active for one Thread; **Project Skill** is an explicit Project default.
- "extension installed" could imply globally active — resolved: **Extension** install is app-level; **Project Extension** enablement is per-Project.
- "worktree" was treated like a separate workspace tab — resolved: **Worktree** is a Project execution environment, not a separate Project by default.
- "worktree selection" could be global-only — resolved: **Project Preferences** define the default; Thread or Slice execution can override it.
- "worktree switch" could silently change execution history — resolved: Worktree switches are **Environment Changes** in the **Thread Transcript**.
- "memory" was used for answers, backlog, and transcripts — resolved: avoid **Memory** as a UI noun; use **Answer**, **Backlog**, **Thread Transcript**, or **Project Context**.
- "answer" and "project context" could collapse into one record — resolved: **Answer** preserves the original response; **Project Context** is normalized and editable.
- "answer" could lose the prompt context — resolved: **Answer** stores the exact question, help text, response, and Question Frame version.
- "answer correction" could overwrite history — resolved: corrections create **Answer Revisions**.
- "project context" could become unattributed notes — resolved: direct edits are allowed, and every entry records **Context Provenance**.
- "project context" could become a loose note pile — resolved: organize it by **Project Context Sections**.
- "open questions" could be hidden in Backlog — resolved: **Open Questions** live in **Project Context** and may block readiness.
- "decision" could mean either casual note or formal ADR — resolved: important choices become first-class **Decision** records; smaller notes can stay in Project Context.
- "risk" could remain a vague note — resolved: actionable risks become first-class **Risk** records.
- "requirements" could be only loose notes — resolved: high-level notes stay in Project Context; testable requirements become **Requirement** records.
- "covered requirement" could be mistaken for verified — resolved: **Requirement Status** separates covered from verified.
