import type {
  AppView,
  ExtensionCommandCompatibilityRecord,
  GlobalPlanningPreferences,
  ModelSettingsScopeMode,
  NotificationPreferences,
  PreferenceChangeRecord,
  ProjectPreferenceRecord,
  ProjectBacklogItemCategory,
  ProjectBacklogItem,
  ProjectBacklogItemStatus,
} from "../src/desktop-state";
import { normalizeWorkflowPhaseModelPreferences } from "../src/planning-phase-models";
import type { ModelSettingsSnapshot } from "@pi-gui/session-driver/runtime-types";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const uiStateWriteQueueByPath = new Map<string, Promise<void>>();
const PERSISTED_UI_STATE_VERSIONS: readonly NonNullable<PersistedUiState["version"]>[] = [
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
];

export interface PersistedUiState {
  readonly version?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  readonly selectedWorkspaceId?: string;
  readonly selectedSessionId?: string;
  readonly activeView?: AppView;
  readonly composerDraft?: string;
  readonly composerDraftsBySession?: Record<string, string>;
  readonly extensionCommandCompatibilityByWorkspace?: Record<string, readonly ExtensionCommandCompatibilityRecord[]>;
  readonly notificationPreferences?: NotificationPreferences;
  readonly globalPlanningPreferences?: GlobalPlanningPreferences;
  readonly projectPreferencesByWorkspace?: Record<string, ProjectPreferenceRecord>;
  readonly preferenceChangesByWorkspace?: Record<string, readonly PreferenceChangeRecord[]>;
  readonly backlogByWorkspace?: Record<string, readonly ProjectBacklogItem[]>;
  readonly integratedTerminalShell?: string;
  readonly lastViewedAtBySession?: Record<string, string>;
  readonly workspaceOrder?: readonly string[];
  readonly modelSettingsScopeMode?: ModelSettingsScopeMode;
  readonly appGlobalModelSettings?: ModelSettingsSnapshot;
  readonly sidebarCollapsed?: boolean;
}

export interface LegacyPersistedUiState extends PersistedUiState {
  readonly composerAttachmentsBySession?: Record<string, readonly unknown[]>;
  readonly transcripts?: Record<string, readonly unknown[]>;
}

export async function readPersistedUiState(uiStateFilePath: string): Promise<LegacyPersistedUiState> {
  try {
    const raw = await readFile(uiStateFilePath, "utf8");
    const parsed = JSON.parse(raw) as LegacyPersistedUiState;
    return {
      version: toPersistedVersion(parsed.version),
      selectedWorkspaceId: parsed.selectedWorkspaceId,
      selectedSessionId: parsed.selectedSessionId,
      activeView: parsed.activeView,
      composerDraft: parsed.composerDraft ?? "",
      composerDraftsBySession: parsed.composerDraftsBySession,
      extensionCommandCompatibilityByWorkspace: parsed.extensionCommandCompatibilityByWorkspace,
      notificationPreferences: parsed.notificationPreferences,
      globalPlanningPreferences: toPersistedGlobalPlanningPreferences(parsed.globalPlanningPreferences),
      projectPreferencesByWorkspace: toPersistedProjectPreferencesByWorkspace(parsed.projectPreferencesByWorkspace),
      preferenceChangesByWorkspace: toPersistedPreferenceChangesByWorkspace(parsed.preferenceChangesByWorkspace),
      backlogByWorkspace: toPersistedBacklogByWorkspace(parsed.backlogByWorkspace),
      integratedTerminalShell:
        typeof parsed.integratedTerminalShell === "string" ? parsed.integratedTerminalShell : undefined,
      lastViewedAtBySession: parsed.lastViewedAtBySession,
      workspaceOrder: Array.isArray(parsed.workspaceOrder) ? parsed.workspaceOrder : undefined,
      modelSettingsScopeMode:
        parsed.modelSettingsScopeMode === "per-repo" || parsed.modelSettingsScopeMode === "app-global"
          ? parsed.modelSettingsScopeMode
          : undefined,
      appGlobalModelSettings: toPersistedModelSettingsSnapshot(parsed.appGlobalModelSettings),
      sidebarCollapsed: parsed.sidebarCollapsed === true,
      composerAttachmentsBySession: parsed.composerAttachmentsBySession,
      transcripts: parsed.transcripts,
    };
  } catch {
    return {};
  }
}

export async function writePersistedUiState(
  uiStateFilePath: string,
  payload: PersistedUiState,
): Promise<void> {
  await enqueueUiStateWrite(uiStateFilePath, async () => {
    await mkdir(dirname(uiStateFilePath), { recursive: true });
    const serialized = `${JSON.stringify(
      {
        version: 10,
        ...payload,
      } satisfies PersistedUiState,
      null,
      2,
    )}\n`;
    const tmpPath = `${uiStateFilePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(tmpPath, serialized, "utf8");

    try {
      await rename(tmpPath, uiStateFilePath);
    } catch (error) {
      if (!isReplaceRenameError(error)) {
        await cleanupTempFile(tmpPath);
        throw error;
      }

      try {
        await unlink(uiStateFilePath);
      } catch (unlinkError) {
        if (!isMissingFileError(unlinkError)) {
          await cleanupTempFile(tmpPath);
          throw unlinkError;
        }
      }

      try {
        await rename(tmpPath, uiStateFilePath);
      } catch (renameError) {
        await cleanupTempFile(tmpPath);
        throw renameError;
      }
    }
  });
}

function toPersistedVersion(value: unknown): PersistedUiState["version"] | undefined {
  return PERSISTED_UI_STATE_VERSIONS.includes(value as NonNullable<PersistedUiState["version"]>)
    ? (value as PersistedUiState["version"])
    : undefined;
}

function toPersistedGlobalPlanningPreferences(value: unknown): GlobalPlanningPreferences | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const candidate = value as Partial<GlobalPlanningPreferences>;
  return {
    phaseModels: normalizeWorkflowPhaseModelPreferences(candidate.phaseModels),
  };
}

function toPersistedProjectPreferencesByWorkspace(
  value: unknown,
): Record<string, ProjectPreferenceRecord> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([workspaceId, preferences]) => [workspaceId, toPersistedProjectPreferences(preferences)] as const)
    .filter((entry): entry is readonly [string, ProjectPreferenceRecord] => Boolean(entry[1]));
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function toPersistedProjectPreferences(value: unknown): ProjectPreferenceRecord | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const candidate = value as ProjectPreferenceRecord;
  const defaultWorktreeId =
    typeof candidate.defaultWorktreeId === "string" && candidate.defaultWorktreeId.trim()
      ? candidate.defaultWorktreeId
      : undefined;
  const updatedAt = typeof candidate.updatedAt === "string" ? candidate.updatedAt : undefined;
  return defaultWorktreeId || updatedAt ? { ...(defaultWorktreeId ? { defaultWorktreeId } : {}), ...(updatedAt ? { updatedAt } : {}) } : undefined;
}

function toPersistedPreferenceChangesByWorkspace(
  value: unknown,
): Record<string, readonly PreferenceChangeRecord[]> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([workspaceId, changes]) => [
      workspaceId,
      Array.isArray(changes) ? changes.filter(isPreferenceChangeRecord) : [],
    ] as const)
    .filter(([, changes]) => changes.length > 0);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function isPreferenceChangeRecord(value: unknown): value is PreferenceChangeRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const change = value as PreferenceChangeRecord;
  return (
    typeof change.id === "string" &&
    (change.scope === "settings" || change.scope === "project-preferences") &&
    typeof change.field === "string" &&
    typeof change.from === "string" &&
    typeof change.to === "string" &&
    change.changedBy === "user" &&
    typeof change.changedAt === "string"
  );
}

function toPersistedBacklogByWorkspace(value: unknown): Record<string, readonly ProjectBacklogItem[]> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([workspaceId, items]) => [
      workspaceId,
      Array.isArray(items) ? items.map(toPersistedBacklogItem).filter((item): item is ProjectBacklogItem => Boolean(item)) : [],
    ] as const)
    .filter(([, items]) => items.length > 0);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function toPersistedBacklogItem(value: unknown): ProjectBacklogItem | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const item = value as ProjectBacklogItem;
  if (
    typeof item.id === "string" &&
    typeof item.workspaceId === "string" &&
    typeof item.text === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string" &&
    Boolean(item.source) &&
    typeof item.source.workspaceId === "string" &&
    typeof item.source.sessionId === "string" &&
    typeof item.source.messageId === "string"
  ) {
    const { discussionThread, ...rest } = item;
    return {
      ...rest,
      category: normalizeBacklogCategory(item.category),
      status: normalizeBacklogStatus(item.status),
      ...(isBacklogDiscussionThread(discussionThread) ? { discussionThread } : {}),
    };
  }
  return undefined;
}

function isBacklogDiscussionThread(value: unknown): value is NonNullable<ProjectBacklogItem["discussionThread"]> {
  return (
    Boolean(value) &&
    typeof (value as NonNullable<ProjectBacklogItem["discussionThread"]>).workspaceId === "string" &&
    typeof (value as NonNullable<ProjectBacklogItem["discussionThread"]>).sessionId === "string"
  );
}

function normalizeBacklogCategory(value: unknown): ProjectBacklogItemCategory {
  return value === "idea" ||
    value === "question" ||
    value === "bug" ||
    value === "risk" ||
    value === "follow-up" ||
    value === "decision" ||
    value === "task"
    ? value
    : "follow-up";
}

function normalizeBacklogStatus(value: unknown): ProjectBacklogItemStatus {
  if (value === "started") {
    return "in-discussion";
  }
  return value === "open" ||
    value === "in-discussion" ||
    value === "promoted" ||
    value === "dismissed" ||
    value === "done" ||
    value === "removed"
    ? value
    : "open";
}

function toPersistedModelSettingsSnapshot(value: unknown): ModelSettingsSnapshot | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const candidate = value as Record<string, unknown>;
  const enabledModelPatterns = Array.isArray(candidate.enabledModelPatterns)
    ? candidate.enabledModelPatterns.filter((entry): entry is string => typeof entry === "string")
    : [];
  return {
    ...(typeof candidate.defaultProvider === "string" ? { defaultProvider: candidate.defaultProvider } : {}),
    ...(typeof candidate.defaultModelId === "string" ? { defaultModelId: candidate.defaultModelId } : {}),
    ...(typeof candidate.defaultThinkingLevel === "string"
      ? { defaultThinkingLevel: candidate.defaultThinkingLevel as ModelSettingsSnapshot["defaultThinkingLevel"] }
      : {}),
    enabledModelPatterns,
  };
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isReplaceRenameError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error.code === "EEXIST" || error.code === "EPERM");
}

async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }
}

async function enqueueUiStateWrite(uiStateFilePath: string, write: () => Promise<void>): Promise<void> {
  const previous = uiStateWriteQueueByPath.get(uiStateFilePath) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(write);
  uiStateWriteQueueByPath.set(uiStateFilePath, next);

  try {
    await next;
  } finally {
    if (uiStateWriteQueueByPath.get(uiStateFilePath) === next) {
      uiStateWriteQueueByPath.delete(uiStateFilePath);
    }
  }
}
