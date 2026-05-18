import type { DiscussStage } from "./plan-builder-discuss";

export const blankPlanningStarterTemplateId = "blank";

export interface PlanningStarterTemplateAnswer {
  readonly stage: DiscussStage;
  readonly questionId: string;
  readonly answer: string;
}

export interface PlanningStarterTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly answerPrefills: readonly PlanningStarterTemplateAnswer[];
}

export const planningStarterTemplates: readonly PlanningStarterTemplate[] = [
  {
    id: "web-app",
    name: "Web app",
    description: "Seeds the first planning pass with common product, UX, persistence, and verification concerns.",
    answerPrefills: [
      {
        stage: "project",
        questionId: "project_shape",
        answer: "complex - UI, persistence, verification, and shipping concerns need explicit planning.",
      },
      {
        stage: "project",
        questionId: "project_antigoals",
        answer: "Avoid speculative features before the first useful workflow is verified.",
      },
      {
        stage: "project",
        questionId: "project_constraints",
        answer: "Keep slices independently verifiable.\nPersist user state before generating or exporting artifacts.",
      },
      {
        stage: "requirements",
        questionId: "requirements_quality",
        answer: "Each user-facing capability needs acceptance criteria, regression coverage, and verification evidence.",
      },
      {
        stage: "milestone",
        questionId: "milestone_sequence",
        answer: "DISCUSS, RESEARCH, PLAN, EXECUTE, VERIFY, SHIP.",
      },
    ],
  },
];

export function getPlanningStarterTemplate(templateId: string | undefined): PlanningStarterTemplate | undefined {
  return planningStarterTemplates.find((template) => template.id === templateId);
}

export function serializePlanningStarterTemplate(template: PlanningStarterTemplate): string {
  return JSON.stringify(
    {
      templateId: template.id,
      name: template.name,
      description: template.description,
      prefilledQuestions: template.answerPrefills.map((answer) => ({
        stage: answer.stage,
        questionId: answer.questionId,
      })),
    },
    null,
    2,
  );
}
