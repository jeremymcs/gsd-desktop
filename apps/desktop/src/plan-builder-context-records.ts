import type { DecisionRecord, PlanSnapshot, RiskRecord } from "@pi-gui/gsd-planning";
import { getLatestAnswersByQuestion } from "./plan-builder-discuss";

export function buildDecisionDrafts(snapshot: PlanSnapshot | undefined): readonly DecisionRecord[] {
  const latest = getLatestAnswersByQuestion(snapshot);
  const shape = latest.get("project_shape");
  const shipSignal = latest.get("milestone_ship_signal");
  const decisions: DecisionRecord[] = [];
  if (shape?.loadBearing && shape.answer.trim()) {
    decisions.push({
      id: "D001",
      choice: "Project complexity classification",
      rationale: shape.answer.trim(),
      alternatives: ["simple", "complex"],
      date: shape.createdAt,
      linkedThreadIds: [],
      linkedPlanChangeIds: [],
    });
  }
  if (shipSignal?.loadBearing && shipSignal.answer.trim()) {
    decisions.push({
      id: "D002",
      choice: "Ship readiness signal",
      rationale: shipSignal.answer.trim(),
      alternatives: ["ship after explicit verification evidence", "ship with explicit risk acceptance"],
      date: shipSignal.createdAt,
      linkedThreadIds: [],
      linkedPlanChangeIds: [],
    });
  }
  return decisions;
}

export function buildRiskDrafts(snapshot: PlanSnapshot | undefined): readonly RiskRecord[] {
  const risks = getLatestAnswersByQuestion(snapshot).get("milestone_risks");
  if (!risks?.loadBearing || !risks.answer.trim()) {
    return [];
  }
  return [{
    id: "K001",
    title: "Plan-changing execution risk",
    impact: "medium",
    likelihood: "medium",
    mitigation: risks.answer.trim(),
    owner: "Unassigned",
    status: "open",
    linkedSliceIds: [],
    linkedVerificationIds: [],
    linkedRiskAcceptanceIds: [],
  }];
}
