import type { AnswerRecord, RequirementId, RequirementRecord } from "@pi-gui/gsd-planning";
import { getDiscussQuestion, type DiscussQuestion } from "./plan-builder-discuss";

export interface AdaptiveFollowUp {
  readonly question: string;
  readonly rationale: string;
  readonly severity: "medium" | "high";
  readonly signals: readonly string[];
}

export interface AdaptiveFollowUpContext {
  readonly requirements?: readonly RequirementRecord[];
}

interface AnswerSignal {
  readonly severity: "medium" | "high";
  readonly signals: readonly string[];
  readonly rationale?: string;
}

interface RequirementFollowUpContext {
  readonly signals: readonly string[];
  readonly rationale?: string;
}

const followUpQuestions: Readonly<Record<string, string>> = {
  project_title: "What name would you recognize in a file, branch, or task list next week?",
  project_vision: "What should exist after this project that does not exist today?",
  project_shape: "What makes this simple or complex: integrations, users, scope, or existing code?",
  project_users: "Who uses this first, and what pain are they trying to get out of?",
  project_core_value: "What specific moment should feel easier, faster, or safer after this ships?",
  project_antigoals: "What tempting feature or direction should stay out of scope?",
  project_constraints: "Which constraint would most change the plan: time, platform, data, compatibility, or budget?",
  requirements_capabilities: "What is one user-visible capability the first useful version must prove?",
  requirements_quality: "What failure would make this unacceptable even if the feature exists?",
  requirements_integrations: "Which file, system, API, or person must this workflow interact with?",
  requirements_validation: "What evidence would make you comfortable moving from requirements to PLAN?",
  milestone_first_outcome: "What should the first milestone prove with real behavior?",
  milestone_sequence: "What order would reduce the biggest uncertainty first?",
  milestone_risks: "Which risk would force the plan to change if it became true?",
  milestone_ship_signal: "What exact demo, test, or generated output would make this shippable?",
};

const uncertaintyPatterns = [
  /\bnot sure\b/,
  /\bunsure\b/,
  /\byour call\b/,
  /\btbd\b/,
  /\bunknown\b/,
  /\bmaybe\b/,
  /\bwhatever\b/,
  /\bidk\b/,
  /\bn\/a\b/,
  /\bto be decided\b/,
  /\bneed to think\b/,
];

const questionSignals: Readonly<Record<string, readonly string[]>> = {
  project_title: ["working name"],
  project_vision: ["target outcome"],
  project_shape: ["complexity drivers"],
  project_users: ["primary user"],
  project_core_value: ["user-visible value"],
  project_antigoals: ["scope boundary"],
  project_constraints: ["decision constraint"],
  requirements_capabilities: ["must-have capability"],
  requirements_quality: ["quality bar"],
  requirements_integrations: ["dependency surface"],
  requirements_validation: ["validation evidence"],
  milestone_first_outcome: ["end-to-end proof"],
  milestone_sequence: ["delivery order"],
  milestone_risks: ["plan-changing risk"],
  milestone_ship_signal: ["ship evidence"],
};

const requirementContextByQuestion: Readonly<
  Record<string, { readonly id: RequirementId; readonly signal: string }>
> = {
  requirements_capabilities: { id: "R001", signal: "functional requirement" },
  requirements_quality: { id: "R002", signal: "quality requirement" },
  requirements_integrations: { id: "R003", signal: "integration requirement" },
  requirements_validation: { id: "R004", signal: "validation signal" },
};

export function buildAdaptiveFollowUpForDraft(
  question: DiscussQuestion | undefined,
  answer: string,
  context?: AdaptiveFollowUpContext,
): AdaptiveFollowUp | undefined {
  const signal = question ? analyzeAnswer(question, answer, context) : undefined;
  if (!question || !signal) {
    return undefined;
  }
  return buildFollowUp(question, signal);
}

export function buildAdaptiveFollowUpForAnswer(
  answer: AnswerRecord,
  context?: AdaptiveFollowUpContext,
): AdaptiveFollowUp | undefined {
  const question = getDiscussQuestion(answer.questionId);
  const signal = question ? analyzeAnswer(question, answer.answer, context) : undefined;
  if (!question || !answer.loadBearing || !signal) {
    return undefined;
  }
  return buildFollowUp(question, signal);
}

function buildFollowUp(
  question: DiscussQuestion,
  signal: AnswerSignal,
): AdaptiveFollowUp {
  return {
    question: followUpQuestions[question.id] ?? question.prompt,
    rationale: buildRationale(question, signal),
    severity: signal.severity,
    signals: signal.signals,
  };
}

function analyzeAnswer(
  question: DiscussQuestion,
  answer: string,
  context?: AdaptiveFollowUpContext,
): AnswerSignal | undefined {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  const requirementContext = getRequirementContext(question, context);
  if (uncertaintyPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      severity: "high",
      signals: buildSignals(question, "uncertainty", requirementContext?.signals),
      ...(requirementContext?.rationale ? { rationale: requirementContext.rationale } : {}),
    };
  }
  if (question.id === "project_title") {
    return undefined;
  }
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 2) {
    return {
      severity: "medium",
      signals: buildSignals(question, "low detail", requirementContext?.signals),
      ...(requirementContext?.rationale ? { rationale: requirementContext.rationale } : {}),
    };
  }
  return undefined;
}

function buildSignals(
  question: DiscussQuestion,
  issue: string,
  contextSignals: readonly string[] | undefined,
): readonly string[] {
  return [issue, ...(questionSignals[question.id] ?? ["planning detail"]), ...(contextSignals ?? [])];
}

function getRequirementContext(
  question: DiscussQuestion,
  context: AdaptiveFollowUpContext | undefined,
): RequirementFollowUpContext | undefined {
  const requirementContext = requirementContextByQuestion[question.id];
  if (!requirementContext) {
    return undefined;
  }
  const requirement = context?.requirements?.find((entry) => entry.id === requirementContext.id);
  if (!requirement) {
    return {
      signals: ["requirement contract gap"],
    };
  }
  return {
    signals: [requirement.id, requirementContext.signal, requirement.validationStatus],
    rationale: `This answer feeds ${requirement.id}. Tighten the ${requirementContext.signal} before it steers PLAN.`,
  };
}

function buildRationale(question: DiscussQuestion, signal: AnswerSignal): string {
  if (signal.rationale) {
    return signal.rationale;
  }
  if (question.stage === "requirements") {
    return "This requirements answer needs enough detail to become a contract row before PLAN.";
  }
  return "This answer looks uncertain. Tighten it before saving if it should steer the plan.";
}
