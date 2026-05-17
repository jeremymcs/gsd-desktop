import type { DiscussStage } from "./plan-builder-discuss";

export interface WorkflowPromptSource {
  readonly family: string;
  readonly prompt: string;
  readonly purpose: string;
}

export const workflowPromptSources = {
  discussProject: {
    family: "Guided DISCUSS",
    prompt: "guided-discuss-project.md",
    purpose: "Project vision, users, shape, anti-goals, and constraints.",
  },
  discussRequirements: {
    family: "Guided DISCUSS",
    prompt: "guided-discuss-requirements.md",
    purpose: "Capability contract, requirement class, owner, status, and validation state.",
  },
  discussMilestone: {
    family: "Guided DISCUSS",
    prompt: "guided-discuss-milestone.md",
    purpose: "Milestone outcome, sequence, risks, and ship signal.",
  },
  researchDecision: {
    family: "Guided RESEARCH",
    prompt: "guided-research-decision.md",
    purpose: "Whether the project needs domain research before planning.",
  },
  researchProject: {
    family: "Guided RESEARCH",
    prompt: "guided-research-project.md",
    purpose: "Findings that should change planning decisions.",
  },
  planRoadmap: {
    family: "Guided PLAN",
    prompt: "plan-milestone.md / plan-slice.md",
    purpose: "Milestones, slices, task boundaries, dependencies, and acceptance.",
  },
  executeTask: {
    family: "Guided EXECUTE",
    prompt: "execute-task.md",
    purpose: "Task execution, blockers, notes, and evidence.",
  },
  verifyUat: {
    family: "Guided VERIFY",
    prompt: "run-uat.md",
    purpose: "Acceptance checks against evidence and UAT expectations.",
  },
  shipCloseout: {
    family: "Guided SHIP",
    prompt: "complete-slice.md / complete-milestone.md",
    purpose: "Closeout summary, verification evidence, and handoff context.",
  },
} as const satisfies Record<string, WorkflowPromptSource>;

export function promptSourceForDiscussStage(stage: DiscussStage): WorkflowPromptSource {
  switch (stage) {
    case "project":
      return workflowPromptSources.discussProject;
    case "requirements":
      return workflowPromptSources.discussRequirements;
    case "milestone":
      return workflowPromptSources.discussMilestone;
  }
}
