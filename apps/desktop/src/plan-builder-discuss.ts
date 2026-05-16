import type { AnswerRecord, PlanSnapshot, PlanStage, ProjectSummary } from "@pi-gui/gsd-planning";

export type DiscussStage = Extract<PlanStage, "project" | "requirements" | "milestone">;

export interface DiscussQuestion {
  readonly id: string;
  readonly stage: DiscussStage;
  readonly label: string;
  readonly prompt: string;
  readonly helper: string;
  readonly loadBearing: boolean;
}

export interface DiscussStageProgress {
  readonly stage: DiscussStage;
  readonly total: number;
  readonly answered: number;
  readonly readyForReview: boolean;
  readonly depthConfirmed: boolean;
}

export const discussStageOrder: readonly DiscussStage[] = ["project", "requirements", "milestone"];

export const discussQuestions: readonly DiscussQuestion[] = [
  {
    id: "project_title",
    stage: "project",
    label: "Name",
    prompt: "What should we call this project?",
    helper: "Use a short working title. It can change later.",
    loadBearing: true,
  },
  {
    id: "project_vision",
    stage: "project",
    label: "Outcome",
    prompt: "What are we building, and what outcome should it create?",
    helper: "Describe the end state in plain language.",
    loadBearing: true,
  },
  {
    id: "project_users",
    stage: "project",
    label: "Users",
    prompt: "Who is it for, and what pain are they bringing?",
    helper: "Name the primary users, not every possible audience.",
    loadBearing: true,
  },
  {
    id: "project_core_value",
    stage: "project",
    label: "Value",
    prompt: "What must feel clearly better when this ships?",
    helper: "This becomes the north star for later planning tradeoffs.",
    loadBearing: true,
  },
  {
    id: "project_antigoals",
    stage: "project",
    label: "Anti-goals",
    prompt: "What should this not become?",
    helper: "List anything that should stay out of scope.",
    loadBearing: true,
  },
  {
    id: "project_constraints",
    stage: "project",
    label: "Constraints",
    prompt: "What constraints should shape every decision?",
    helper: "Include time, platform, data, team, budget, compatibility, or migration constraints.",
    loadBearing: true,
  },
  {
    id: "requirements_capabilities",
    stage: "requirements",
    label: "Capabilities",
    prompt: "What must the first useful version be able to do?",
    helper: "Write capabilities as user-visible behavior, not implementation tasks.",
    loadBearing: true,
  },
  {
    id: "requirements_quality",
    stage: "requirements",
    label: "Quality bar",
    prompt: "What quality bar makes this acceptable?",
    helper: "Call out reliability, speed, UX, accessibility, security, and maintainability expectations.",
    loadBearing: true,
  },
  {
    id: "requirements_integrations",
    stage: "requirements",
    label: "Integrations",
    prompt: "What systems, files, data, or people does this need to interact with?",
    helper: "Name hard dependencies and any systems that must not be disturbed.",
    loadBearing: true,
  },
  {
    id: "requirements_validation",
    stage: "requirements",
    label: "Validation",
    prompt: "How should we know the requirements are complete enough to plan?",
    helper: "Define what evidence would make the requirements feel settled.",
    loadBearing: true,
  },
  {
    id: "milestone_first_outcome",
    stage: "milestone",
    label: "First milestone",
    prompt: "What should the first milestone prove end to end?",
    helper: "Pick the smallest meaningful outcome, not a setup-only checkpoint.",
    loadBearing: true,
  },
  {
    id: "milestone_sequence",
    stage: "milestone",
    label: "Sequence",
    prompt: "What major phases or slices do you expect?",
    helper: "Rough order is enough; the PLAN phase will turn this into structure.",
    loadBearing: true,
  },
  {
    id: "milestone_risks",
    stage: "milestone",
    label: "Risks",
    prompt: "What could block execution or force the plan to change?",
    helper: "Include unknowns, dependency risk, migration risk, and decision points.",
    loadBearing: true,
  },
  {
    id: "milestone_ship_signal",
    stage: "milestone",
    label: "Ship signal",
    prompt: "What would make you comfortable shipping this project?",
    helper: "Describe the verification signal, demo, or acceptance bar.",
    loadBearing: true,
  },
];

export function isDiscussStage(stage: PlanStage): stage is DiscussStage {
  return stage === "project" || stage === "requirements" || stage === "milestone";
}

export function getDiscussQuestionsForStage(stage: DiscussStage): readonly DiscussQuestion[] {
  return discussQuestions.filter((question) => question.stage === stage);
}

export function getDiscussQuestion(questionId: string): DiscussQuestion | undefined {
  return discussQuestions.find((question) => question.id === questionId);
}

export function getNextDiscussStage(stage: DiscussStage): DiscussStage | undefined {
  const index = discussStageOrder.indexOf(stage);
  return discussStageOrder[index + 1];
}

export function getLatestAnswersByQuestion(snapshot: PlanSnapshot | undefined): Map<string, AnswerRecord> {
  const latest = new Map<string, AnswerRecord>();
  for (const answer of snapshot?.answers ?? []) {
    latest.set(answer.questionId, answer);
  }
  return latest;
}

export function getLatestDiscussAnswers(snapshot: PlanSnapshot | undefined): readonly AnswerRecord[] {
  return [...getLatestAnswersByQuestion(snapshot).values()].filter((answer) => isDiscussStage(answer.stage));
}

export function getDiscussStageProgress(
  snapshot: PlanSnapshot | undefined,
  stage: DiscussStage,
): DiscussStageProgress {
  const questions = getDiscussQuestionsForStage(stage);
  const latest = getLatestAnswersByQuestion(snapshot);
  const answered = questions.filter((question) => {
    const answer = latest.get(question.id);
    return Boolean(answer?.loadBearing && answer.answer.trim());
  }).length;
  const stageState = snapshot?.stages.find((entry) => entry.stage === stage);
  return {
    stage,
    total: questions.length,
    answered,
    readyForReview: answered === questions.length,
    depthConfirmed: Boolean(stageState?.depthConfirmedAt),
  };
}

export function getActiveDiscussQuestion(snapshot: PlanSnapshot | undefined): DiscussQuestion | undefined {
  if (!snapshot || !isDiscussStage(snapshot.activeStage)) {
    return undefined;
  }
  const stageState = snapshot.stages.find((entry) => entry.stage === snapshot.activeStage);
  const activeQuestion = stageState?.activeQuestionId
    ? getDiscussQuestion(stageState.activeQuestionId)
    : undefined;
  if (activeQuestion) {
    return activeQuestion;
  }
  return getNextUnansweredQuestion(snapshot, snapshot.activeStage);
}

export function getNextUnansweredQuestion(
  snapshot: PlanSnapshot | undefined,
  stage: DiscussStage,
): DiscussQuestion | undefined {
  const latest = getLatestAnswersByQuestion(snapshot);
  return getDiscussQuestionsForStage(stage).find((question) => {
    const answer = latest.get(question.id);
    return !answer?.loadBearing || !answer.answer.trim();
  });
}

export function buildProjectPatch(questionId: string, answer: string): Partial<ProjectSummary> | undefined {
  const value = answer.trim();
  if (!value) {
    return undefined;
  }

  switch (questionId) {
    case "project_title":
      return { title: firstLine(value) };
    case "project_vision":
      return { vision: value };
    case "project_users":
      return { users: value };
    case "project_core_value":
      return { coreValue: value };
    case "project_antigoals":
      return { antiGoals: parseList(value) };
    case "project_constraints":
      return { constraints: parseList(value) };
    default:
      return undefined;
  }
}

function firstLine(value: string): string {
  return value.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? value;
}

function parseList(value: string): readonly string[] {
  const parsed = value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : [value];
}
