import type { PlanSnapshot, RequirementRecord } from "@pi-gui/gsd-planning";
import { getLatestAnswersByQuestion } from "./plan-builder-discuss";

const requirementDrafts = [
  {
    id: "R001",
    questionId: "requirements_capabilities",
    title: "First useful version capabilities",
    class: "functional",
    why: "Defines the user-visible behavior required before execution planning.",
  },
  {
    id: "R002",
    questionId: "requirements_quality",
    title: "Quality bar",
    class: "quality",
    why: "Defines the acceptance bar before PLAN.",
  },
  {
    id: "R003",
    questionId: "requirements_integrations",
    title: "Required integrations",
    class: "integration",
    why: "Identifies dependencies that can change the plan boundary.",
  },
  {
    id: "R004",
    questionId: "requirements_validation",
    title: "Requirements validation signal",
    class: "operational",
    why: "Defines the evidence needed to move from DISCUSS to PLAN.",
  },
] as const;

export function buildRequirementDrafts(snapshot: PlanSnapshot | undefined): readonly RequirementRecord[] {
  const latest = getLatestAnswersByQuestion(snapshot);
  return requirementDrafts.flatMap((draft) => {
    const answer = latest.get(draft.questionId);
    const description = answer?.loadBearing ? answer.answer.trim() : "";
    if (!description) {
      return [];
    }

    return [
      {
        id: draft.id,
        title: draft.title,
        class: draft.class,
        status: "active",
        description,
        why: draft.why,
        source: "user",
        owner: "M1/none yet",
        validationStatus: "unvalidated",
      },
    ];
  });
}
