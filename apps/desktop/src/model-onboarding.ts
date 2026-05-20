import type { RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import { buildModelOptions } from "./composer-commands";

export type ModelOnboardingSettingsSection = "models" | "providers";

export interface ModelOnboardingNotice {
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly actionSection: ModelOnboardingSettingsSection;
}

export interface ModelOnboardingState {
  readonly hasSelectableModels: boolean;
  readonly requiresModelSelection: boolean;
  readonly unselectedModelLabel: string;
  readonly emptyModelTitle: string;
  readonly emptyModelDescription: string;
  readonly notice?: ModelOnboardingNotice;
}

interface ModelSelectionInput {
  readonly provider: string | undefined;
  readonly modelId: string | undefined;
}

export function deriveModelOnboardingState(
  runtime: RuntimeSnapshot | undefined,
  currentSelection: ModelSelectionInput,
): ModelOnboardingState {
  const selectableModels = buildModelOptions(runtime);
  const selectableSet = new Set(selectableModels.map((model) => `${model.providerId}:${model.modelId}`));
  const hasSelectableModels = selectableModels.length > 0;
  const connectedProviderCount = runtime?.providers.filter((provider) => provider.hasAuth).length ?? 0;
  const settingsDefault = {
    provider: runtime?.settings.defaultProvider,
    modelId: runtime?.settings.defaultModelId,
  };
  const hasDefaultModel = Boolean(settingsDefault.provider && settingsDefault.modelId);
  const defaultModelUsable = isUsableSelection(settingsDefault, selectableSet);
  const hasCurrentSelection = Boolean(currentSelection.provider && currentSelection.modelId);
  const currentSelectionUsable = isUsableSelection(currentSelection, selectableSet);

  if (!hasSelectableModels) {
    return {
      hasSelectableModels: false,
      requiresModelSelection: true,
      unselectedModelLabel: "No Models Available",
      emptyModelTitle: "No Models Available",
      emptyModelDescription:
        connectedProviderCount > 0
          ? "Open Model Settings to enable models."
          : "Open Provider Settings to connect a provider and make models available.",
      notice: connectedProviderCount > 0
        ? {
            title: "No Models Available",
            description: "All available models are currently disabled. Open Model Settings to enable models.",
            actionLabel: "Open Model Settings",
            actionSection: "models",
          }
        : {
            title: "No Models Available",
            description: "Connect a provider in Provider Settings before choosing a model or setting a default.",
            actionLabel: "Open Provider Settings",
            actionSection: "providers",
          },
    };
  }

  if (hasCurrentSelection && !currentSelectionUsable) {
    return {
      hasSelectableModels: true,
      requiresModelSelection: true,
      unselectedModelLabel: "Choose Model",
      emptyModelTitle: "No Models Available",
      emptyModelDescription: "Choose a model.",
      notice: {
        title: "Selected Model Unavailable",
        description: hasDefaultModel
          ? "The model selected for this thread is no longer available. Choose another model, then open Model Settings to update the default."
          : "The model selected for this thread is no longer available. Choose another model, then open Model Settings to choose the app default.",
        actionLabel: "Open Model Settings",
        actionSection: "models",
      },
    };
  }

  if (!hasDefaultModel) {
    return {
      hasSelectableModels: true,
      requiresModelSelection: !currentSelectionUsable,
      unselectedModelLabel: "Choose Model",
      emptyModelTitle: "No Default Model Set",
      emptyModelDescription: "Choose a model.",
      notice: currentSelectionUsable
        ? undefined
        : {
            title: "No Default Model Set",
            description: "Set a default model in Model Settings.",
            actionLabel: "Open Model Settings",
            actionSection: "models",
          },
    };
  }

  if (!defaultModelUsable) {
    const defaultLabel = `${settingsDefault.provider}:${settingsDefault.modelId}`;
    return {
      hasSelectableModels: true,
      requiresModelSelection: !currentSelectionUsable,
      unselectedModelLabel: "Choose Model",
      emptyModelTitle: "Default Model Unavailable",
      emptyModelDescription: "Choose a model.",
      notice: {
        title: "Default Model Unavailable",
        description: currentSelectionUsable
          ? `Your saved default (${defaultLabel}) is no longer available. Open Model Settings to update it.`
          : `Your saved default (${defaultLabel}) is no longer available. Choose a model for this thread, then open Model Settings to update it.`,
        actionLabel: "Open Model Settings",
        actionSection: "models",
      },
    };
  }

  return {
    hasSelectableModels: true,
    requiresModelSelection: false,
    unselectedModelLabel: "Choose Model",
    emptyModelTitle: "No Models Available",
    emptyModelDescription: "Choose a model.",
  };
}

function isUsableSelection(
  selection: ModelSelectionInput,
  selectableSet: ReadonlySet<string>,
): boolean {
  return Boolean(selection.provider && selection.modelId && selectableSet.has(`${selection.provider}:${selection.modelId}`));
}
