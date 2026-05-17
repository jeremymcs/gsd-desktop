import type { AnswerRecord } from "@pi-gui/gsd-planning";
import { getDiscussQuestion, type DiscussQuestion } from "./plan-builder-discuss";

export interface AdaptiveFollowUp {
  readonly question: string;
  readonly rationale: string;
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

export function buildAdaptiveFollowUpForDraft(
  question: DiscussQuestion | undefined,
  answer: string,
): AdaptiveFollowUp | undefined {
  if (!question || !isVagueAnswer(question, answer)) {
    return undefined;
  }
  return buildFollowUp(question);
}

export function buildAdaptiveFollowUpForAnswer(answer: AnswerRecord): AdaptiveFollowUp | undefined {
  const question = getDiscussQuestion(answer.questionId);
  if (!question || !answer.loadBearing || !isVagueAnswer(question, answer.answer)) {
    return undefined;
  }
  return buildFollowUp(question);
}

function buildFollowUp(question: DiscussQuestion): AdaptiveFollowUp {
  return {
    question: followUpQuestions[question.id] ?? question.prompt,
    rationale: "This answer looks uncertain. Tighten it before saving if it should steer the plan.",
  };
}

function isVagueAnswer(question: DiscussQuestion, answer: string): boolean {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (uncertaintyPatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }
  if (question.id === "project_title") {
    return false;
  }
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  return wordCount <= 2;
}
