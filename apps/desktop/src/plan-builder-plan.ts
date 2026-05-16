import type { AnswerRecord, GeneratedOutputRecord, PlanSnapshot } from "@pi-gui/gsd-planning";
import type {
  PlanningMilestoneDraft,
  PlanningPlanProposalDraft,
  PlanningSliceDraft,
  PlanningTaskDraft,
  PlanningValidationIssue,
} from "./desktop-state";

export function buildPlanProposalDraft(
  snapshot: PlanSnapshot | undefined,
  answers: readonly AnswerRecord[],
  acceptedResearch: readonly GeneratedOutputRecord[],
): PlanningPlanProposalDraft {
  const latestAnswers = new Map(answers.map((answer) => [answer.questionId, answer.answer]));
  const firstOutcome =
    latestAnswers.get("milestone_first_outcome") ??
    snapshot?.project.coreValue ??
    snapshot?.name ??
    "First useful milestone";
  const firstCapability =
    latestAnswers.get("requirements_capabilities") ?? "Deliver the first usable version with persisted planning state.";
  const qualityBar = latestAnswers.get("requirements_quality") ?? "Verify the workflow through restart-safe desktop coverage.";
  const researchSummary =
    acceptedResearch[0]?.content.replace(/\s+/g, " ").trim() ||
    "Use accepted research to confirm boundaries and risks before execution.";

  return {
    version: 1,
    boundaryMap: `Use accepted research to protect persistence, UI, and verification boundaries. Research: ${researchSummary}`,
    ideaPool: "Park follow-up slices, dependency risks, and scope changes here until they are promoted into a milestone.",
    milestones: [
      {
        id: "M1",
        title: firstLine(firstOutcome),
        phase: "PLAN",
        outcome: firstOutcome,
        slices: [
          {
            id: "S1",
            title: "Plan Builder vertical slice",
            goal: firstCapability,
            boundary: "Desktop Plan Builder UI, planning IPC, and .gsd/gsd.db event persistence.",
            tasks: [
              {
                id: "T1",
                title: "Implement and verify the slice",
                acceptance: qualityBar,
                dependencies: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

export function serializePlanProposal(proposal: PlanningPlanProposalDraft): string {
  return JSON.stringify(proposal, null, 2);
}

export function parsePlanProposal(content: string): PlanningPlanProposalDraft | undefined {
  try {
    const value = JSON.parse(content) as Partial<PlanningPlanProposalDraft>;
    if (value.version !== 1 || !Array.isArray(value.milestones)) {
      return undefined;
    }
    return {
      version: 1,
      boundaryMap: typeof value.boundaryMap === "string" ? value.boundaryMap : "",
      ideaPool: typeof value.ideaPool === "string" ? value.ideaPool : "",
      milestones: value.milestones.map(normalizeMilestone),
    };
  } catch {
    return undefined;
  }
}

export function validatePlanProposal(proposal: PlanningPlanProposalDraft): readonly PlanningValidationIssue[] {
  const issues: PlanningValidationIssue[] = [];
  const taskIds = new Set<string>();
  const dependencyGraph = new Map<string, readonly string[]>();

  if (!proposal.boundaryMap.trim()) {
    issues.push(issue("boundary", "Boundary map", "Boundary map is required before approval."));
  }

  if (proposal.milestones.length === 0) {
    issues.push(issue("milestones", "Milestones", "At least one milestone is required."));
  }

  for (const [milestoneIndex, milestone] of proposal.milestones.entries()) {
    const milestonePath = `Milestone ${milestoneIndex + 1}`;
    if (!milestone.id.trim()) {
      issues.push(issue(`milestone-${milestoneIndex}-id`, milestonePath, "Milestone id is required."));
    }
    if (!milestone.title.trim()) {
      issues.push(issue(`milestone-${milestoneIndex}-title`, milestonePath, "Milestone title is required."));
    }
    if (!milestone.phase.trim()) {
      issues.push(issue(`milestone-${milestoneIndex}-phase`, milestonePath, "Milestone phase is required."));
    }
    if (!milestone.outcome.trim()) {
      issues.push(issue(`milestone-${milestoneIndex}-outcome`, milestonePath, "Milestone outcome is required."));
    }
    if (milestone.slices.length === 0) {
      issues.push(issue(`milestone-${milestoneIndex}-slices`, milestonePath, "Milestone needs at least one slice."));
    }

    for (const [sliceIndex, slice] of milestone.slices.entries()) {
      const slicePath = `${milestonePath} / Slice ${sliceIndex + 1}`;
      if (!slice.id.trim()) {
        issues.push(issue(`slice-${milestoneIndex}-${sliceIndex}-id`, slicePath, "Slice id is required."));
      }
      if (!slice.title.trim()) {
        issues.push(issue(`slice-${milestoneIndex}-${sliceIndex}-title`, slicePath, "Slice title is required."));
      }
      if (!slice.goal.trim()) {
        issues.push(issue(`slice-${milestoneIndex}-${sliceIndex}-goal`, slicePath, "Slice goal is required."));
      }
      if (!slice.boundary.trim()) {
        issues.push(issue(`slice-${milestoneIndex}-${sliceIndex}-boundary`, slicePath, "Slice boundary is required."));
      }
      if (slice.tasks.length === 0) {
        issues.push(issue(`slice-${milestoneIndex}-${sliceIndex}-tasks`, slicePath, "Slice needs at least one task."));
      }

      for (const [taskIndex, task] of slice.tasks.entries()) {
        const taskPath = `${slicePath} / Task ${taskIndex + 1}`;
        const taskId = task.id.trim();
        if (!taskId) {
          issues.push(issue(`task-${milestoneIndex}-${sliceIndex}-${taskIndex}-id`, taskPath, "Task id is required."));
        } else if (taskIds.has(taskId)) {
          issues.push(issue(`task-${taskId}-duplicate`, taskPath, `Task id ${taskId} is duplicated.`));
        } else {
          taskIds.add(taskId);
        }
        if (!task.title.trim()) {
          issues.push(issue(`task-${taskId || taskIndex}-title`, taskPath, "Task title is required."));
        }
        if (!task.acceptance.trim()) {
          issues.push(issue(`task-${taskId || taskIndex}-acceptance`, taskPath, "Task acceptance is required."));
        }
        dependencyGraph.set(taskId, task.dependencies.map((dependency) => dependency.trim()).filter(Boolean));
      }
    }
  }

  for (const [taskId, dependencies] of dependencyGraph.entries()) {
    for (const dependency of dependencies) {
      if (dependency === taskId) {
        issues.push(issue(`dependency-${taskId}-self`, taskId, `Task ${taskId} cannot depend on itself.`));
      } else if (!taskIds.has(dependency)) {
        issues.push(issue(`dependency-${taskId}-${dependency}`, taskId, `Unknown dependency ${dependency}.`));
      }
    }
  }

  for (const cycle of findDependencyCycles(dependencyGraph)) {
    issues.push(
      issue(`dependency-cycle-${cycle.join("-")}`, "Dependencies", `Dependency cycle includes ${cycle.join(" -> ")}.`),
    );
  }

  return issues;
}

export function nextPlanId(prefix: string, existingIds: readonly string[]): string {
  const used = new Set(existingIds);
  let index = 1;
  while (used.has(`${prefix}${index}`)) {
    index += 1;
  }
  return `${prefix}${index}`;
}

export function splitDependencies(value: string): readonly string[] {
  return value
    .split(",")
    .map((dependency) => dependency.trim())
    .filter(Boolean);
}

function normalizeMilestone(value: Partial<PlanningMilestoneDraft>): PlanningMilestoneDraft {
  return {
    id: typeof value.id === "string" ? value.id : "",
    title: typeof value.title === "string" ? value.title : "",
    phase: typeof value.phase === "string" ? value.phase : "",
    outcome: typeof value.outcome === "string" ? value.outcome : "",
    slices: Array.isArray(value.slices) ? value.slices.map(normalizeSlice) : [],
  };
}

function normalizeSlice(value: Partial<PlanningSliceDraft>): PlanningSliceDraft {
  return {
    id: typeof value.id === "string" ? value.id : "",
    title: typeof value.title === "string" ? value.title : "",
    goal: typeof value.goal === "string" ? value.goal : "",
    boundary: typeof value.boundary === "string" ? value.boundary : "",
    tasks: Array.isArray(value.tasks) ? value.tasks.map(normalizeTask) : [],
  };
}

function normalizeTask(value: Partial<PlanningTaskDraft>): PlanningTaskDraft {
  return {
    id: typeof value.id === "string" ? value.id : "",
    title: typeof value.title === "string" ? value.title : "",
    acceptance: typeof value.acceptance === "string" ? value.acceptance : "",
    dependencies: Array.isArray(value.dependencies)
      ? value.dependencies.filter((dependency): dependency is string => typeof dependency === "string")
      : [],
  };
}

function issue(id: string, path: string, message: string): PlanningValidationIssue {
  return { id, path, message };
}

function firstLine(value: string): string {
  return value.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? value;
}

function findDependencyCycles(graph: Map<string, readonly string[]>): readonly string[][] {
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (taskId: string, path: readonly string[]) => {
    if (visiting.has(taskId)) {
      const cycleStart = path.indexOf(taskId);
      cycles.push([...path.slice(Math.max(0, cycleStart)), taskId]);
      return;
    }
    if (visited.has(taskId)) {
      return;
    }
    visiting.add(taskId);
    for (const dependency of graph.get(taskId) ?? []) {
      if (graph.has(dependency)) {
        visit(dependency, [...path, taskId]);
      }
    }
    visiting.delete(taskId);
    visited.add(taskId);
  };

  for (const taskId of graph.keys()) {
    visit(taskId, []);
  }

  return cycles;
}
