import type {
  DecisionProjection,
  GeneratedOutputRecord,
  GeneratePlanningProjectionsInput,
  MilestoneProjection,
  PhaseProjection,
  PlanSnapshot,
  SliceProjection,
  StateProjection,
  TaskProjection,
} from "@pi-gui/gsd-planning";
import type {
  PlanningMilestoneDraft,
  PlanningPlanProposalDraft,
  PlanningSliceDraft,
  PlanningTaskDraft,
} from "./desktop-state";
import { parsePlanProposal } from "./plan-builder-plan";

export function buildPlanningProjectionInput(
  snapshot: PlanSnapshot,
  generatedAt = new Date().toISOString(),
): GeneratePlanningProjectionsInput {
  const acceptedPlan = findAcceptedPlanOutput(snapshot);
  if (!acceptedPlan) {
    throw new Error("Accepted PLAN is required before projections can be generated");
  }

  const proposal = parsePlanProposal(acceptedPlan.content);
  if (!proposal) {
    throw new Error("Accepted PLAN content is invalid and cannot be projected");
  }

  const acceptedResearch = snapshot.generatedOutputs.filter(
    (output) => output.stage === "research" && output.status === "accepted",
  );
  const phases = proposal.phases.map(toPhaseProjection);
  const milestones = proposal.milestones.map((milestone, index) =>
    toMilestoneProjection(milestone, index, proposal, acceptedResearch),
  );

  return {
    plan: snapshot,
    generatedAt,
    decisions: buildDecisions(snapshot, acceptedPlan, acceptedResearch, milestones),
    phases,
    state: buildState(snapshot, milestones),
    milestones,
  };
}

function findAcceptedPlanOutput(snapshot: PlanSnapshot): GeneratedOutputRecord | undefined {
  return [...snapshot.generatedOutputs]
    .filter((output) => output.stage === "roadmap" && output.status === "accepted")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
}

function toPhaseProjection(phase: PlanningPlanProposalDraft["phases"][number]): PhaseProjection {
  return {
    id: fallbackText(phase.id, "P1"),
    title: fallbackText(phase.title, "Untitled phase"),
    goal: fallbackText(phase.goal, "Deliver the phase goal."),
  };
}

function toMilestoneProjection(
  milestone: PlanningMilestoneDraft,
  index: number,
  proposal: PlanningPlanProposalDraft,
  acceptedResearch: readonly GeneratedOutputRecord[],
): MilestoneProjection {
  const slices = milestone.slices.map((slice, sliceIndex) => toSliceProjection(slice, milestone, sliceIndex));
  const successCriteria = slices.flatMap((slice) => slice.mustHaves).filter(Boolean);

  return {
    id: fallbackId(milestone.id, "M", index),
    title: fallbackText(milestone.title, `Milestone ${index + 1}`),
    phaseId: fallbackText(milestone.phase, "P1"),
    vision: fallbackText(milestone.outcome, "Deliver the milestone outcome."),
    successCriteria:
      successCriteria.length > 0 ? successCriteria : [fallbackText(milestone.outcome, "Milestone is complete.")],
    status: index === 0 ? "active" : "pending",
    contextMarkdown: renderMilestoneContext(milestone, proposal),
    researchMarkdown: renderMilestoneResearch(milestone, acceptedResearch),
    boundaryMap: [
      {
        title: "Accepted plan boundary",
        produces: [fallbackText(proposal.boundaryMap, "No boundary map captured.")],
        consumes:
          acceptedResearch.length > 0
            ? acceptedResearch.map((output) => `${output.title}: ${firstLine(output.content)}`)
            : ["No accepted research consumed."],
      },
    ],
    slices,
  };
}

function toSliceProjection(
  slice: PlanningSliceDraft,
  milestone: PlanningMilestoneDraft,
  index: number,
): SliceProjection {
  const tasks = slice.tasks.map((task, taskIndex) => toTaskProjection(task, slice, milestone, taskIndex));
  const dependencies = unique(slice.tasks.flatMap((task) => task.dependencies));
  const mustHaves = slice.tasks
    .map((task) => task.acceptance.trim())
    .filter(Boolean);

  return {
    id: fallbackId(slice.id, "S", index),
    title: fallbackText(slice.title, `Slice ${index + 1}`),
    status: "pending",
    risk: dependencies.length > 0 ? "high" : "medium",
    depends: dependencies,
    demo: firstNonEmpty(mustHaves) ?? fallbackText(slice.goal, "Slice can be demonstrated."),
    goal: fallbackText(slice.goal, "Deliver the slice goal."),
    mustHaves: mustHaves.length > 0 ? mustHaves : [fallbackText(slice.goal, "Slice goal is satisfied.")],
    contextMarkdown: renderSliceContext(slice, milestone),
    tasks,
  };
}

function toTaskProjection(
  task: PlanningTaskDraft,
  slice: PlanningSliceDraft,
  milestone: PlanningMilestoneDraft,
  index: number,
): TaskProjection {
  const acceptance = fallbackText(task.acceptance, "Acceptance signal is captured.");
  const title = fallbackText(task.title, `Task ${index + 1}`);

  return {
    id: fallbackId(task.id, "T", index),
    title,
    status: "pending",
    dependencies: unique(task.dependencies),
    requirementIds: unique(task.requirementIds),
    description: title,
    goal: acceptance,
    mustHaves: {
      truths: [acceptance],
      artifacts: [fallbackText(slice.boundary, "Planned slice boundary.")],
      keyLinks:
        task.dependencies.length > 0
          ? task.dependencies
          : [`${fallbackText(milestone.id, "M")}/${fallbackText(slice.id, "S")}`],
    },
    steps: [`Implement ${title}.`, `Verify ${acceptance}`],
    context: [
      `Milestone outcome: ${fallbackText(milestone.outcome, "Not captured.")}`,
      `Slice goal: ${fallbackText(slice.goal, "Not captured.")}`,
      `Boundary: ${fallbackText(slice.boundary, "Not captured.")}`,
    ],
  };
}

function buildState(snapshot: PlanSnapshot, milestones: readonly MilestoneProjection[]): StateProjection {
  const activeMilestone = milestones.find((milestone) => milestone.status === "active") ?? milestones[0];
  const activeSlice = activeMilestone?.slices[0];
  const activeTask = activeSlice?.tasks[0];

  return {
    ...(activeMilestone ? { activeMilestoneId: activeMilestone.id, activeMilestoneTitle: activeMilestone.title } : {}),
    ...(activeSlice ? { activeSliceId: activeSlice.id, activeSliceTitle: activeSlice.title } : {}),
    ...(activeTask ? { activeTaskId: activeTask.id, activeTaskTitle: activeTask.title } : {}),
    phase: snapshot.activePhase,
    recentDecisions: ["Database remains canonical.", "Markdown files are generated projections."],
    blockers: ["None"],
    nextAction: activeTask ? `Start ${activeTask.id}: ${activeTask.title}.` : "Start the accepted plan.",
  };
}

function buildDecisions(
  snapshot: PlanSnapshot,
  acceptedPlan: GeneratedOutputRecord,
  acceptedResearch: readonly GeneratedOutputRecord[],
  milestones: readonly MilestoneProjection[],
): readonly DecisionProjection[] {
  return [
    {
      id: "D001",
      when: snapshot.readableId,
      scope: "source-of-truth",
      decision: "Planning persistence",
      choice: "Database is canonical; Markdown files are regenerated projections.",
      rationale: "Users can revise, park, add, or remove planning state without hand-editing generated docs.",
      revisable: "Yes",
    },
    {
      id: "D002",
      when: "RESEARCH",
      scope: "planning",
      decision: "Accepted research",
      choice:
        acceptedResearch.length > 0
          ? acceptedResearch.map((output) => output.title).join(", ")
          : "No accepted research attached.",
      rationale: "PLAN should consume only reviewed research output.",
      revisable: "Yes",
    },
    {
      id: "D003",
      when: "PLAN",
      scope: "roadmap",
      decision: acceptedPlan.title,
      choice: `${milestones.length} milestone${milestones.length === 1 ? "" : "s"} projected from the accepted plan.`,
      rationale: "Approved PLAN output defines the execution structure.",
      revisable: "Yes",
    },
  ];
}

function renderMilestoneContext(milestone: PlanningMilestoneDraft, proposal: PlanningPlanProposalDraft): string {
  const phase = proposal.phases.find((entry) => entry.id === milestone.phase);
  return [
    `# ${fallbackText(milestone.id, "Milestone")}: ${fallbackText(milestone.title, "Untitled milestone")} - Context`,
    "",
    "## Outcome",
    "",
    fallbackText(milestone.outcome, "Not captured."),
    "",
    "## Phase",
    "",
    renderMilestonePhaseContext(milestone, phase),
    "",
    "## Deferred Ideas",
    "",
    fallbackText(proposal.ideaPool, "None recorded."),
  ].join("\n");
}

function renderMilestonePhaseContext(
  milestone: PlanningMilestoneDraft,
  phase: PlanningPlanProposalDraft["phases"][number] | undefined,
): string {
  if (!phase) {
    return fallbackText(milestone.phase, "Unassigned");
  }
  return [
    `${fallbackText(phase.id, "P1")}: ${fallbackText(phase.title, "Untitled phase")}`,
    "",
    fallbackText(phase.goal, "Deliver the phase goal."),
  ].join("\n");
}

function renderMilestoneResearch(
  milestone: PlanningMilestoneDraft,
  acceptedResearch: readonly GeneratedOutputRecord[],
): string {
  const sections = acceptedResearch.map((output) =>
    [`## ${output.title}`, "", output.content.trim() || "No findings recorded."].join("\n"),
  );

  return [
    `# ${fallbackText(milestone.id, "Milestone")}: ${fallbackText(milestone.title, "Untitled milestone")} - Research`,
    "",
    sections.length > 0 ? sections.join("\n\n") : "No accepted research recorded.",
  ].join("\n");
}

function renderSliceContext(slice: PlanningSliceDraft, milestone: PlanningMilestoneDraft): string {
  return [
    `# ${fallbackText(slice.id, "Slice")}: ${fallbackText(slice.title, "Untitled slice")} - Context`,
    "",
    `**Milestone:** ${fallbackText(milestone.id, "Milestone")}`,
    "",
    "## Goal",
    "",
    fallbackText(slice.goal, "Not captured."),
    "",
    "## Boundary",
    "",
    fallbackText(slice.boundary, "Not captured."),
  ].join("\n");
}

function fallbackId(value: string, prefix: string, index: number): string {
  return value.trim() || `${prefix}${index + 1}`;
}

function fallbackText(value: string, fallback: string): string {
  return value.trim() || fallback;
}

function firstLine(value: string): string {
  return value.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? value.trim();
}

function firstNonEmpty(values: readonly string[]): string | undefined {
  return values.map((value) => value.trim()).find(Boolean);
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
