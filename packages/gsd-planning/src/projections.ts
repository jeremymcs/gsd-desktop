import type {
  ChangeProposalActivityRecord,
  ChangeProposalRecord,
  ChangeProposalStatus,
  PlanPhase,
  PlanSnapshot,
  RequirementRecord,
  RequirementStatus,
  TaskExecutionRecord,
  TaskSessionLinkRecord,
  TaskVerificationRecord,
} from "./types.js";
import { computeNextWorkQueue, type NextWorkQueueItem } from "./next-work.js";

export const GENERATED_PROJECTION_MARKER = "pi-gui-plan-builder-generated";
export const GENERATED_PROJECTION_SOURCE = ".gsd/gsd.db";

export type ProjectionFileKind =
  | "project"
  | "requirements"
  | "state"
  | "next-work"
  | "decisions"
  | "milestone-context"
  | "milestone-research"
  | "milestone-roadmap"
  | "slice-context"
  | "slice-plan"
  | "task-plan";

export interface ProjectionFile {
  readonly kind: ProjectionFileKind;
  readonly path: string;
  readonly content: string;
}

export interface GeneratePlanningProjectionsInput {
  readonly plan: PlanSnapshot;
  readonly generatedAt?: string;
  readonly decisions?: readonly DecisionProjection[];
  readonly state?: StateProjection;
  readonly phases?: readonly PhaseProjection[];
  readonly milestones?: readonly MilestoneProjection[];
}

export interface PhaseProjection {
  readonly id: string;
  readonly title: string;
  readonly goal: string;
  readonly status?: "pending" | "active" | "done";
}

export interface DecisionProjection {
  readonly id: string;
  readonly when: string;
  readonly scope: string;
  readonly decision: string;
  readonly choice: string;
  readonly rationale: string;
  readonly revisable: string;
}

export interface StateProjection {
  readonly activeMilestoneId?: string;
  readonly activeMilestoneTitle?: string;
  readonly activeSliceId?: string;
  readonly activeSliceTitle?: string;
  readonly activeTaskId?: string;
  readonly activeTaskTitle?: string;
  readonly phase?: PlanPhase | string;
  readonly recentDecisions?: readonly string[];
  readonly blockers?: readonly string[];
  readonly nextAction?: string;
}

export interface MilestoneProjection {
  readonly id: string;
  readonly title: string;
  readonly phaseId?: string;
  readonly vision: string;
  readonly successCriteria: readonly string[];
  readonly status?: "pending" | "active" | "done";
  readonly contextMarkdown?: string;
  readonly researchMarkdown?: string;
  readonly slices: readonly SliceProjection[];
  readonly boundaryMap: readonly BoundaryMapEntry[];
}

export interface BoundaryMapEntry {
  readonly title: string;
  readonly produces: readonly string[];
  readonly consumes: readonly string[];
}

export interface SliceProjection {
  readonly id: string;
  readonly title: string;
  readonly status?: "pending" | "active" | "done";
  readonly risk: "low" | "medium" | "high";
  readonly depends: readonly string[];
  readonly demo: string;
  readonly goal: string;
  readonly mustHaves: readonly string[];
  readonly filesLikelyTouched?: readonly string[];
  readonly contextMarkdown?: string;
  readonly tasks: readonly TaskProjection[];
}

export interface TaskProjection {
  readonly id: string;
  readonly title: string;
  readonly status?: "pending" | "active" | "done";
  readonly dependencies?: readonly string[];
  readonly requirementIds?: readonly string[];
  readonly description: string;
  readonly goal: string;
  readonly mustHaves: {
    readonly truths: readonly string[];
    readonly artifacts: readonly string[];
    readonly keyLinks: readonly string[];
  };
  readonly steps: readonly string[];
  readonly context: readonly string[];
}

export function generatePlanningProjections(input: GeneratePlanningProjectionsInput): readonly ProjectionFile[] {
  const header = renderGeneratedHeader(input);
  const milestones = input.milestones ?? [];
  const phases = input.phases ?? derivePhasesFromMilestones(milestones);
  const files: ProjectionFile[] = [
    {
      kind: "project",
      path: ".gsd/PROJECT.md",
      content: withHeader(header, renderProject(input.plan, phases, milestones)),
    },
    {
      kind: "requirements",
      path: ".gsd/REQUIREMENTS.md",
      content: withHeader(header, renderRequirements(input.plan.requirements, milestones)),
    },
    {
      kind: "state",
      path: ".gsd/STATE.md",
      content: withHeader(header, renderState(input.plan, input.state, milestones)),
    },
    {
      kind: "next-work",
      path: ".gsd/NEXT.md",
      content: withHeader(header, renderNextWork(input.plan, milestones)),
    },
    {
      kind: "decisions",
      path: ".gsd/DECISIONS.md",
      content: withHeader(header, renderDecisions(input.decisions ?? [])),
    },
  ];

  for (const milestone of milestones) {
    files.push({
      kind: "milestone-context",
      path: `.gsd/milestones/${milestone.id}/${milestone.id}-CONTEXT.md`,
      content: withHeader(header, milestone.contextMarkdown ?? renderDefaultMilestoneContext(milestone)),
    });
    files.push({
      kind: "milestone-research",
      path: `.gsd/milestones/${milestone.id}/${milestone.id}-RESEARCH.md`,
      content: withHeader(header, milestone.researchMarkdown ?? renderDefaultMilestoneResearch(milestone)),
    });
    files.push({
      kind: "milestone-roadmap",
      path: `.gsd/milestones/${milestone.id}/${milestone.id}-ROADMAP.md`,
      content: withHeader(header, renderMilestoneRoadmap(milestone, phases)),
    });

    for (const slice of milestone.slices) {
      files.push({
        kind: "slice-context",
        path: `.gsd/milestones/${milestone.id}/slices/${slice.id}/${slice.id}-CONTEXT.md`,
        content: withHeader(header, slice.contextMarkdown ?? renderDefaultSliceContext(milestone, slice)),
      });
      files.push({
        kind: "slice-plan",
        path: `.gsd/milestones/${milestone.id}/slices/${slice.id}/${slice.id}-PLAN.md`,
        content: withHeader(header, renderSlicePlan(slice)),
      });

      for (const task of slice.tasks) {
        files.push({
          kind: "task-plan",
          path: `.gsd/milestones/${milestone.id}/slices/${slice.id}/tasks/${task.id}-PLAN.md`,
          content: withHeader(header, renderTaskPlan(milestone, slice, task)),
        });
      }
    }
  }

  return files;
}

export function hasGeneratedProjectionHeader(content: string): boolean {
  return content.startsWith(`<!-- ${GENERATED_PROJECTION_MARKER}`);
}

function renderGeneratedHeader(input: GeneratePlanningProjectionsInput): string {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  return [
    `<!-- ${GENERATED_PROJECTION_MARKER}`,
    `source: ${GENERATED_PROJECTION_SOURCE}`,
    `plan-id: ${input.plan.id}`,
    `plan-readable-id: ${input.plan.readableId}`,
    `plan-revision: ${input.plan.revision}`,
    `generated-at: ${generatedAt}`,
    "do-not-edit: true",
    "-->",
  ].join("\n");
}

function withHeader(header: string, body: string): string {
  return `${header}\n\n${body.trimEnd()}\n`;
}

function renderProject(
  plan: PlanSnapshot,
  phases: readonly PhaseProjection[],
  milestones: readonly MilestoneProjection[],
): string {
  const project = plan.project;
  return [
    `# Project: ${project.title ?? plan.name}`,
    "",
    "## Project Shape",
    "",
    `**Complexity:** ${project.shape?.complexity ?? "complex"}`,
    `**Why:** ${project.shape?.rationale ?? "Not classified yet."}`,
    "",
    "## Vision",
    "",
    project.vision ?? "Not captured yet.",
    "",
    "## Users",
    "",
    project.users ?? "Not captured yet.",
    "",
    "## Core Value",
    "",
    project.coreValue ?? "Not captured yet.",
    "",
    "## Anti-goals",
    "",
    renderBullets(project.antiGoals),
    "",
    "## Constraints",
    "",
    renderBullets(project.constraints),
    "",
    "## Capability Contract",
    "",
    "See `.gsd/REQUIREMENTS.md`.",
    "",
    "## Milestone Sequence",
    "",
    milestones.length > 0
      ? milestones.map((milestone) => `- **${milestone.id}: ${milestone.title}** — ${milestone.vision}`).join("\n")
      : "- No milestones projected yet.",
    "",
    "## Phase Sequence",
    "",
    renderPhaseSequence(phases),
  ].join("\n");
}

function renderRequirements(
  requirements: readonly RequirementRecord[],
  milestones: readonly MilestoneProjection[],
): string {
  const sections: Array<{ readonly title: string; readonly status: RequirementStatus }> = [
    { title: "Active", status: "active" },
    { title: "Validated", status: "validated" },
    { title: "Deferred", status: "deferred" },
    { title: "Out of Scope", status: "out-of-scope" },
  ];
  const lines = ["# Requirements", ""];

  for (const section of sections) {
    lines.push(`## ${section.title}`, "");
    const entries = requirements.filter((requirement) => requirement.status === section.status);
    lines.push(entries.length > 0 ? entries.map(renderRequirement).join("\n\n") : "_None._");
    lines.push("");
  }

  lines.push("## Traceability", "");
  lines.push("| ID | Owner | Source | Validation |");
  lines.push("|---|---|---|---|");
  for (const requirement of requirements) {
    lines.push(`| ${requirement.id} | ${requirement.owner} | ${requirement.source} | ${requirement.validationStatus} |`);
  }
  if (requirements.length === 0) {
    lines.push("| _None_ | _None_ | _None_ | _None_ |");
  }
  lines.push("");
  lines.push("## Plan Coverage", "");
  lines.push("| ID | Status | Coverage | Plan Items |");
  lines.push("|---|---|---|---|");
  const coverageMap = buildRequirementCoverageMap(milestones);
  for (const requirement of requirements) {
    const planItems = coverageMap.get(requirement.id) ?? [];
    lines.push(
      [
        requirement.id,
        requirement.status,
        formatRequirementCoverage(requirement, planItems),
        planItems.length > 0 ? planItems.join(", ") : "_None_",
      ].map(escapeTableCell).join(" | ").replace(/^/, "| ").concat(" |"),
    );
  }
  if (requirements.length === 0) {
    lines.push("| _None_ | _None_ | _None_ | _None_ |");
  }
  lines.push("");
  lines.push("## Coverage Summary", "");
  lines.push(`Active: ${countRequirements(requirements, "active")}`);
  lines.push(`Validated: ${countRequirements(requirements, "validated")}`);
  lines.push(`Deferred: ${countRequirements(requirements, "deferred")}`);
  lines.push(`Out of Scope: ${countRequirements(requirements, "out-of-scope")}`);

  return lines.join("\n");
}

function renderRequirement(requirement: RequirementRecord): string {
  return [
    `### ${requirement.id}: ${requirement.title}`,
    "",
    `- **Class:** ${requirement.class}`,
    `- **Owner:** ${requirement.owner}`,
    `- **Source:** ${requirement.source}`,
    `- **Validation:** ${requirement.validationStatus}`,
    "",
    requirement.description,
    "",
    `**Why:** ${requirement.why}`,
    requirement.notes ? `\n**Notes:** ${requirement.notes}` : "",
  ].filter(Boolean).join("\n");
}

function renderState(
  plan: PlanSnapshot,
  state: StateProjection | undefined,
  milestones: readonly MilestoneProjection[],
): string {
  const activeMilestone = state?.activeMilestoneId
    ? milestones.find((milestone) => milestone.id === state.activeMilestoneId)
    : milestones.find((milestone) => milestone.status === "active") ?? milestones[0];
  const phase = state?.phase ?? plan.activePhase;

  return [
    "# GSD State",
    "",
    `**Active Plan:** ${plan.readableId} — ${plan.name}`,
    `**Active Milestone:** ${formatActive(state?.activeMilestoneId ?? activeMilestone?.id, state?.activeMilestoneTitle ?? activeMilestone?.title)}`,
    `**Active Slice:** ${formatActive(state?.activeSliceId, state?.activeSliceTitle)}`,
    `**Active Task:** ${formatActive(state?.activeTaskId, state?.activeTaskTitle)}`,
    `**Phase:** ${formatPhase(phase)}`,
    "",
    "## Recent Decisions",
    "",
    renderBullets(state?.recentDecisions ?? []),
    "",
    "## Blockers",
    "",
    renderBullets(state?.blockers ?? ["None"]),
    "",
    "## Next Action",
    "",
    state?.nextAction ?? "Continue the active planning phase.",
    "",
    "## Change Log",
    "",
    renderChangeLog(plan.changeProposals),
  ].join("\n");
}

function renderNextWork(plan: PlanSnapshot, milestones: readonly MilestoneProjection[]): string {
  const taskRefs = getProjectedTaskRefs(milestones);
  const taskById = new Map(taskRefs.map((task) => [task.id, task]));
  const executionById = new Map(plan.taskExecutions.map((execution) => [execution.taskId, execution]));
  const verificationById = new Map(plan.taskVerifications.map((verification) => [verification.taskId, verification]));
  const linkById = new Map(plan.taskSessionLinks.map((link) => [link.taskId, link]));
  const queue = computeNextWorkQueue({
    tasks: taskRefs.map((task) => ({
      taskId: task.id,
      taskPath: task.path,
      title: task.title,
      dependencies: task.dependencies,
    })),
    taskExecutions: plan.taskExecutions,
    taskVerifications: plan.taskVerifications,
  });
  const doneWithoutEvidence = getDoneWithoutEvidence(taskRefs, executionById, verificationById);
  const failedVerifications = plan.taskVerifications.filter((verification) => verification.status === "failed");

  return [
    "# Next Work",
    "",
    `**Active Plan:** ${plan.readableId} - ${plan.name}`,
    `**Phase:** ${formatPhase(plan.activePhase)}`,
    `**Queue:** ${queue.ready.length} ready / ${queue.blocked.length} blocked`,
    "",
    "## Ready",
    "",
    queue.ready.length > 0
      ? queue.ready
          .map((item, index) =>
            renderNextWorkItem(item, index + 1, taskById, linkById, executionById, verificationById),
          )
          .join("\n\n")
      : "_No ready tasks._",
    "",
    "## Blocked",
    "",
    queue.blocked.length > 0
      ? queue.blocked.map((item) => renderBlockedWorkItem(item, taskById, executionById, verificationById)).join("\n\n")
      : "_No blocked tasks._",
    "",
    "## Evidence Gaps",
    "",
    doneWithoutEvidence.length > 0
      ? renderBullets(doneWithoutEvidence.map((task) => `${task.path}: done without evidence`))
      : "- None",
    "",
    "## Verification Gates",
    "",
    renderBullets([
      "A dependency unblocks only after it is done with evidence or has passed verification.",
      "SHIP should wait until accepted tasks are done with evidence or have passed verification.",
      ...failedVerifications.map(
        (verification) => `${verification.taskPath}: failed verification - ${verification.note || verification.acceptance}`,
      ),
    ]),
    "",
    "## Task Plan Files",
    "",
    taskRefs.length > 0
      ? renderBullets(taskRefs.map((task) => `${task.path}: ${task.filePath}`))
      : "- No task plan files projected.",
  ].join("\n");
}

function renderDecisions(decisions: readonly DecisionProjection[]): string {
  const lines = [
    "# Decisions Register",
    "",
    "<!-- Append-only. Never edit or remove existing rows.",
    "     To reverse a decision, add a new row that supersedes it.",
    "     Read this file at the start of any planning or research phase. -->",
    "",
    "| # | When | Scope | Decision | Choice | Rationale | Revisable? |",
    "|---|------|-------|----------|--------|-----------|------------|",
  ];

  for (const decision of decisions) {
    lines.push([
      decision.id,
      decision.when,
      decision.scope,
      decision.decision,
      decision.choice,
      decision.rationale,
      decision.revisable,
    ].map(escapeTableCell).join(" | ").replace(/^/, "| ").concat(" |"));
  }

  return lines.join("\n");
}

function renderChangeLog(proposals: readonly ChangeProposalRecord[]): string {
  const entries = proposals.filter((proposal) => proposal.activity.length > 0);
  return entries.length > 0 ? entries.map(renderChangeProposalLog).join("\n\n") : "- None";
}

function renderChangeProposalLog(proposal: ChangeProposalRecord): string {
  const lines = [
    `### ${proposal.title}`,
    "",
    `- **Status:** ${formatChangeProposalStatus(proposal.status)}`,
  ];

  if (proposal.injectedTaskPath) {
    lines.push(`- **Injected task:** ${proposal.injectedTaskPath}`);
  }
  if (proposal.modifiedTaskPath) {
    lines.push(`- **Modified task:** ${proposal.modifiedTaskPath}`);
  }

  lines.push("- **Activity:**");
  for (const activity of proposal.activity) {
    lines.push(`  - ${formatChangeProposalActivityLabel(activity)}: ${activity.summary}`);
  }

  return lines.join("\n");
}

function formatChangeProposalStatus(status: ChangeProposalStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "approved":
      return "Approved";
    case "withdrawn":
      return "Deleted";
  }
}

function formatChangeProposalActivityLabel(activity: ChangeProposalActivityRecord): string {
  switch (activity.type) {
    case "drafted":
      return "Drafted";
    case "updated":
      return "Edited";
    case "withdrawn":
      return "Deleted";
    case "approved":
      return "Approved";
    case "task-modified":
      return "Modified";
    case "task-hidden":
      return "Hidden";
    case "task-restored":
      return "Restored";
  }
}

function renderMilestoneRoadmap(
  milestone: MilestoneProjection,
  phases: readonly PhaseProjection[],
): string {
  return [
    `# ${milestone.id}: ${milestone.title}`,
    "",
    `**Phase:** ${formatPhaseReference(milestone.phaseId, phases)}`,
    "",
    `**Vision:** ${milestone.vision}`,
    "",
    "**Success Criteria:**",
    renderBullets(milestone.successCriteria),
    "",
    "---",
    "",
    "## Slices",
    "",
    milestone.slices.map(renderSliceLine).join("\n\n") || "_No slices planned._",
    "",
    "## Boundary Map",
    "",
    milestone.boundaryMap.map(renderBoundaryEntry).join("\n\n") || "_No boundaries planned._",
  ].join("\n");
}

function renderPhaseSequence(phases: readonly PhaseProjection[]): string {
  return phases.length > 0
    ? phases.map((phase) => `- **${phase.id}: ${phase.title}** - ${phase.goal}`).join("\n")
    : "- No phases projected yet.";
}

function formatPhaseReference(phaseId: string | undefined, phases: readonly PhaseProjection[]): string {
  if (!phaseId) {
    return "Unassigned";
  }
  const phase = phases.find((entry) => entry.id === phaseId);
  return phase ? `${phase.id} - ${phase.title}` : phaseId;
}

function derivePhasesFromMilestones(milestones: readonly MilestoneProjection[]): readonly PhaseProjection[] {
  const phases: PhaseProjection[] = [];
  const seen = new Set<string>();
  for (const milestone of milestones) {
    const phaseId = milestone.phaseId?.trim();
    if (!phaseId || seen.has(phaseId)) {
      continue;
    }
    seen.add(phaseId);
    phases.push({
      id: phaseId,
      title: phaseId,
      goal: `Group milestones assigned to ${phaseId}.`,
    });
  }
  return phases;
}

function renderSliceLine(slice: SliceProjection): string {
  const requirementIds = getSliceRequirementIds(slice);
  const requirementLabel = requirementIds.length > 0 ? ` \`reqs:[${requirementIds.join(",")}]\`` : "";
  return [
    `- [${slice.status === "done" ? "x" : " "}] **${slice.id}: ${slice.title}** \`risk:${slice.risk}\` \`depends:[${slice.depends.join(",")}]\`${requirementLabel}`,
    `  > After this: ${slice.demo}`,
  ].join("\n");
}

function renderBoundaryEntry(entry: BoundaryMapEntry): string {
  return [
    `### ${entry.title}`,
    "",
    "Produces:",
    renderIndentedLines(entry.produces),
    "",
    "Consumes:",
    renderIndentedLines(entry.consumes),
  ].join("\n");
}

function renderDefaultMilestoneContext(milestone: MilestoneProjection): string {
  return [
    `# ${milestone.id}: ${milestone.title} — Context`,
    "",
    "**Status:** Ready for planning",
    "",
    "## Implementation Decisions",
    "",
    "- None recorded.",
    "",
    "## Agent's Discretion",
    "",
    "- None recorded.",
    "",
    "## Deferred Ideas",
    "",
    "- None recorded.",
  ].join("\n");
}

function renderDefaultMilestoneResearch(milestone: MilestoneProjection): string {
  return [
    `# ${milestone.id}: ${milestone.title} — Research`,
    "",
    "No research findings recorded yet.",
  ].join("\n");
}

function renderDefaultSliceContext(milestone: MilestoneProjection, slice: SliceProjection): string {
  return [
    `# ${slice.id}: ${slice.title} — Context`,
    "",
    `**Milestone:** ${milestone.id}`,
    "",
    "## Goal",
    "",
    slice.goal,
    "",
    "## Scope",
    "",
    "### In Scope",
    "",
    renderBullets(slice.mustHaves),
    "",
    "### Out of Scope",
    "",
    "- None recorded.",
    "",
    "## Open Questions",
    "",
    "- None recorded.",
  ].join("\n");
}

function renderSlicePlan(slice: SliceProjection): string {
  return [
    `# ${slice.id}: ${slice.title}`,
    "",
    `**Goal:** ${slice.goal}`,
    `**Demo:** ${slice.demo}`,
    "",
    "## Must-Haves",
    renderBullets(slice.mustHaves),
    "",
    "## Tasks",
    "",
    slice.tasks.map(renderSliceTaskLine).join("\n\n") || "_No tasks planned._",
    "",
    "## Files Likely Touched",
    renderBullets(slice.filesLikelyTouched ?? []),
  ].join("\n");
}

function renderTaskPlan(milestone: MilestoneProjection, slice: SliceProjection, task: TaskProjection): string {
  return [
    `# ${task.id}: ${task.title}`,
    "",
    `**Slice:** ${slice.id}`,
    `**Milestone:** ${milestone.id}`,
    `**Requirements:** ${formatRequirementRefs(task.requirementIds ?? [])}`,
    "",
    "## Goal",
    "",
    task.goal,
    "",
    "## Must-Haves",
    "",
    "### Truths",
    renderBullets(task.mustHaves.truths),
    "",
    "### Artifacts",
    renderBullets(task.mustHaves.artifacts),
    "",
    "### Key Links",
    renderBullets(task.mustHaves.keyLinks),
    "",
    "## Steps",
    renderNumbered(task.steps),
    "",
    "## Context",
    renderBullets(task.context),
  ].join("\n");
}

interface ProjectedTaskRef {
  readonly id: string;
  readonly path: string;
  readonly filePath: string;
  readonly title: string;
  readonly goal: string;
  readonly dependencies: readonly string[];
}

function getProjectedTaskRefs(milestones: readonly MilestoneProjection[]): readonly ProjectedTaskRef[] {
  return milestones.flatMap((milestone) =>
    milestone.slices.flatMap((slice) =>
      slice.tasks.map((task) => ({
        id: task.id,
        path: `${milestone.id}/${slice.id}/${task.id}`,
        filePath: `.gsd/milestones/${milestone.id}/slices/${slice.id}/tasks/${task.id}-PLAN.md`,
        title: task.title,
        goal: task.goal,
        dependencies: task.dependencies ?? [],
      })),
    ),
  );
}

function renderNextWorkItem(
  item: NextWorkQueueItem,
  index: number,
  taskById: ReadonlyMap<string, ProjectedTaskRef>,
  linkById: ReadonlyMap<string, TaskSessionLinkRecord>,
  executionById: ReadonlyMap<string, TaskExecutionRecord>,
  verificationById: ReadonlyMap<string, TaskVerificationRecord>,
): string {
  const task = taskById.get(item.taskId);
  const link = linkById.get(item.taskId);
  return [
    `### ${index}. ${item.taskPath}: ${item.title}`,
    "",
    "- **Why next:** Ready to start.",
    `- **Acceptance:** ${task?.goal ?? "Not captured."}`,
    `- **Execution:** ${formatExecutionState(executionById.get(item.taskId))}`,
    `- **Verification:** ${formatVerificationState(verificationById.get(item.taskId))}`,
    `- **Session:** ${link ? `${link.title} (${link.sessionId})` : "No linked session yet."}`,
    `- **Task plan:** ${task?.filePath ?? "No task plan projected."}`,
  ].join("\n");
}

function renderBlockedWorkItem(
  item: NextWorkQueueItem,
  taskById: ReadonlyMap<string, ProjectedTaskRef>,
  executionById: ReadonlyMap<string, TaskExecutionRecord>,
  verificationById: ReadonlyMap<string, TaskVerificationRecord>,
): string {
  const task = taskById.get(item.taskId);
  return [
    `### ${item.taskPath}: ${item.title}`,
    "",
    `- **Blocked by:** ${formatNextWorkBlockers(item)}`,
    `- **Acceptance:** ${task?.goal ?? "Not captured."}`,
    `- **Execution:** ${formatExecutionState(executionById.get(item.taskId))}`,
    `- **Verification:** ${formatVerificationState(verificationById.get(item.taskId))}`,
    `- **Task plan:** ${task?.filePath ?? "No task plan projected."}`,
  ].join("\n");
}

function getDoneWithoutEvidence(
  tasks: readonly ProjectedTaskRef[],
  executionById: ReadonlyMap<string, TaskExecutionRecord>,
  verificationById: ReadonlyMap<string, TaskVerificationRecord>,
): readonly ProjectedTaskRef[] {
  return tasks.filter((task) => {
    const execution = executionById.get(task.id);
    const verification = verificationById.get(task.id);
    return execution?.status === "done" && execution.evidence.length === 0 && verification?.status !== "passed";
  });
}

function formatNextWorkBlockers(item: NextWorkQueueItem): string {
  const dependencyReasons = item.blockingDependencies.map((dependency) =>
    dependency.taskPath ? `${dependency.taskPath}: ${dependency.reason}` : `${dependency.taskId}: ${dependency.reason}`,
  );
  return [...dependencyReasons, item.blocker].filter(Boolean).join("; ") || "Blocked.";
}

function formatExecutionState(execution: TaskExecutionRecord | undefined): string {
  if (!execution) {
    return "not-started";
  }
  return execution.blocker ? `${execution.status} - ${execution.blocker}` : execution.status;
}

function formatVerificationState(verification: TaskVerificationRecord | undefined): string {
  if (!verification) {
    return "not verified";
  }
  return verification.note ? `${verification.status} - ${verification.note}` : verification.status;
}

function renderBullets(items: readonly string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

function renderNumbered(items: readonly string[]): string {
  return items.length > 0 ? items.map((item, index) => `${index + 1}. ${item}`).join("\n") : "1. No steps recorded.";
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function renderIndentedLines(items: readonly string[]): string {
  return items.length > 0 ? items.map((item) => `  ${item}`).join("\n") : "  nothing";
}

function countRequirements(requirements: readonly RequirementRecord[], status: RequirementStatus): number {
  return requirements.filter((requirement) => requirement.status === status).length;
}

function buildRequirementCoverageMap(milestones: readonly MilestoneProjection[]): Map<string, string[]> {
  const coverage = new Map<string, string[]>();
  for (const milestone of milestones) {
    for (const slice of milestone.slices) {
      for (const task of slice.tasks) {
        const taskPath = `${milestone.id}/${slice.id}/${task.id}`;
        for (const requirementId of unique(task.requirementIds ?? [])) {
          const entries = coverage.get(requirementId) ?? [];
          entries.push(taskPath);
          coverage.set(requirementId, entries);
        }
      }
    }
  }
  return coverage;
}

function formatRequirementCoverage(requirement: RequirementRecord, planItems: readonly string[]): string {
  if (requirement.status === "deferred") {
    return "deferred";
  }
  if (requirement.status === "out-of-scope") {
    return "out-of-scope";
  }
  return planItems.length > 0 ? "covered" : "uncovered";
}

function getSliceRequirementIds(slice: SliceProjection): readonly string[] {
  return unique(slice.tasks.flatMap((task) => task.requirementIds ?? []));
}

function renderSliceTaskLine(task: TaskProjection): string {
  const lines = [
    `- [${task.status === "done" ? "x" : " "}] **${task.id}: ${task.title}**`,
    `  ${task.description}`,
  ];
  const requirementIds = task.requirementIds ?? [];
  if (requirementIds.length > 0) {
    lines.push(`  Reqs: ${formatRequirementRefs(requirementIds)}`);
  }
  return lines.join("\n");
}

function formatRequirementRefs(requirementIds: readonly string[]): string {
  const refs = unique(requirementIds);
  return refs.length > 0 ? refs.join(", ") : "None";
}

function formatActive(id: string | undefined, title: string | undefined): string {
  if (!id && !title) {
    return "None";
  }
  return [id, title].filter(Boolean).join(" — ");
}

function formatPhase(phase: PlanPhase | string): string {
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}
