import type {
  PlanPhase,
  WorkflowPhaseModelPreference,
  WorkflowPhaseModelPreferences,
} from "@pi-gui/gsd-planning";

export const planningPhaseModelOptions: readonly { readonly id: PlanPhase; readonly label: string }[] = [
  { id: "discuss", label: "DISCUSS" },
  { id: "research", label: "RESEARCH" },
  { id: "plan", label: "PLAN" },
  { id: "execute", label: "EXECUTE" },
  { id: "verify", label: "VERIFY" },
  { id: "ship", label: "SHIP" },
] as const;

export function normalizeWorkflowPhaseModelPreferences(value: unknown): WorkflowPhaseModelPreferences {
  if (!value || typeof value !== "object") {
    return {};
  }

  const candidate = value as Partial<Record<PlanPhase, Partial<WorkflowPhaseModelPreference>>>;
  const normalized: WorkflowPhaseModelPreferences = {};
  for (const phase of planningPhaseModelOptions) {
    const preference = candidate[phase.id];
    const providerId = typeof preference?.providerId === "string" ? preference.providerId.trim() : "";
    const modelId = typeof preference?.modelId === "string" ? preference.modelId.trim() : "";
    if (providerId && modelId) {
      normalized[phase.id] = { providerId, modelId };
    }
  }
  return normalized;
}

export function hasWorkflowPhaseModelPreferences(value: WorkflowPhaseModelPreferences | undefined): boolean {
  if (!value) {
    return false;
  }
  return planningPhaseModelOptions.some((phase) => Boolean(value[phase.id]));
}

export function phaseModelPreferenceToValue(preference: WorkflowPhaseModelPreference | undefined): string {
  return preference ? `${preference.providerId}:${preference.modelId}` : "";
}

export function phaseModelPreferenceFromValue(value: string): WorkflowPhaseModelPreference | undefined {
  const [providerId, ...modelParts] = value.split(":");
  const modelId = modelParts.join(":");
  if (!providerId || !modelId) {
    return undefined;
  }
  return { providerId, modelId };
}
