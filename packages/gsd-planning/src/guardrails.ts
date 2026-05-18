import type {
  RunRecoveryStopReason,
  RunRecoverySummaryRecord,
  WorkflowAutonomousStopCondition,
} from "./types.js";

export type GuardrailWarningKind = "projection-conflict" | "projection-drift" | "recovery-stop";

export interface GuardrailProjectionState {
  readonly missing: number;
  readonly stale: number;
  readonly conflicts: readonly string[];
}

export interface GuardrailWarning {
  readonly id: string;
  readonly kind: GuardrailWarningKind;
  readonly condition: WorkflowAutonomousStopCondition;
  readonly title: string;
  readonly detail: string;
  readonly evidence: readonly string[];
}

export interface ComputeGuardrailWarningsInput {
  readonly projection?: GuardrailProjectionState;
  readonly runRecoverySummary?: RunRecoverySummaryRecord;
}

export function computeGuardrailWarnings(input: ComputeGuardrailWarningsInput): readonly GuardrailWarning[] {
  const warnings: GuardrailWarning[] = [];
  const projection = input.projection;

  if (projection && projection.conflicts.length > 0) {
    warnings.push({
      id: "projection-conflict",
      kind: "projection-conflict",
      condition: "dirty-conflict",
      title: "Projection write is blocked",
      detail: `${projection.conflicts.length} generated projection path conflicts with a hand-written file.`,
      evidence: projection.conflicts,
    });
  }

  const driftCount = (projection?.missing ?? 0) + (projection?.stale ?? 0);
  if (projection && driftCount > 0) {
    warnings.push({
      id: "projection-drift",
      kind: "projection-drift",
      condition: "scope-ambiguous",
      title: "Projection drift was detected",
      detail: `${projection.missing} missing and ${projection.stale} stale generated projection file${driftCount === 1 ? "" : "s"} were detected during the last projection check.`,
      evidence: [],
    });
  }

  const recovery = input.runRecoverySummary;
  if (recovery && recoveryStopNeedsAttention(recovery.stopReason)) {
    warnings.push({
      id: "recovery-stop",
      kind: "recovery-stop",
      condition: guardrailConditionForRecoveryStop(recovery.stopReason),
      title: "Previous run stopped before clean completion",
      detail: `${recovery.lastAttemptedTask.taskPath}: ${recovery.stopDetail || recovery.stopReason}`,
      evidence: recovery.resumeTarget ? [`Resume target: ${recovery.resumeTarget.taskPath}`] : [],
    });
  }

  return warnings;
}

function recoveryStopNeedsAttention(reason: RunRecoveryStopReason): boolean {
  return reason !== "task-completed" && reason !== "verification-passed";
}

function guardrailConditionForRecoveryStop(reason: RunRecoveryStopReason): WorkflowAutonomousStopCondition {
  return reason === "verification-failed" ? "tests-fail" : "scope-ambiguous";
}
