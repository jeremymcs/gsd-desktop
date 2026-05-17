import type { AnswerRecord } from "@pi-gui/gsd-planning";
import { getDiscussQuestion, type DiscussQuestion } from "./plan-builder-discuss";

export interface AdaptiveFollowUp {
  readonly question: string;
  readonly rationale: string;
  readonly severity: "medium" | "high";
  readonly signals: readonly string[];
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
  milestone_ship_signal: "What exact demo, test, or artifact would make this shippable?",
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

export function buildAdaptiveFollowUpForDraft(
  question: DiscussQuestion | undefined,
  answer: string,
): AdaptiveFollowUp | undefined {
  const signal = question ? analyzeAnswer(question, answer) : undefined;
  if (!question || !signal) {
    return undefined;
  }
  return buildFollowUp(question, signal);
}

export function buildAdaptiveFollowUpForAnswer(answer: AnswerRecord): AdaptiveFollowUp | undefined {
  const question = getDiscussQuestion(answer.questionId);
  const signal = question ? analyzeAnswer(question, answer.answer) : undefined;
  if (!question || !answer.loadBearing || !signal) {
    return undefined;
  }
  return buildFollowUp(question, signal);
}

function buildFollowUp(
  question: DiscussQuestion,
  signal: { readonly severity: "medium" | "high"; readonly signals: readonly string[] },
): AdaptiveFollowUp {
  return {
    question: followUpQuestions[question.id] ?? question.prompt,
    rationale: "This answer looks uncertain. Tighten it before saving if it should steer the plan.",
    severity: signal.severity,
    signals: signal.signals,
  };
}

function analyzeAnswer(
  question: DiscussQuestion,
  answer: string,
): { readonly severity: "medium" | "high"; readonly signals: readonly string[] } | undefined {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (uncertaintyPatterns.some((pattern) => pattern.test(normalized))) {
    return {
      severity: "high",
      signals: ["uncertainty", ...(questionSignals[question.id] ?? ["planning detail"])],
    };
  }
  if (question.id === "project_title") {
    return undefined;
  }
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 2) {
    return {
      severity: "medium",
      signals: ["low detail", ...(questionSignals[question.id] ?? ["planning detail"])],
    };
  }
  return undefined;
}
