import type { HostUiRequest, SessionConfig } from "@pi-gui/session-driver";
import type { ModelSettingsSnapshot, RuntimeCommandRecord, RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import type {
  PlanListEntry,
  PlanSnapshot,
  PlanStage,
  ParkedItemReviewStatus,
  ProjectSummary,
  RequirementRecord,
  TaskExecutionStatus,
  TaskVerificationStatus,
  WorkflowPhaseModelPreferences,
  WorkflowPreferencesRecord,
} from "@pi-gui/gsd-planning";
export type SessionStatus = "idle" | "running" | "failed";
export type { SessionRole, TranscriptMessage } from "./timeline-types";
import type { TranscriptMessage } from "./timeline-types";

export type AppView = "threads" | "new-thread" | "plans" | "skills" | "extensions" | "settings";
export type WorkspaceKind = "primary" | "worktree";
export type WorktreeStatus = "ready" | "missing" | "error";
export type NewThreadEnvironment = "local" | "worktree";
export type ThemeMode = "system" | "light" | "dark";
export type ModelSettingsScopeMode = "app-global" | "per-repo";
export type ComposerDraftSyncSource =
  | "state"
  | "selection"
  | "persist"
  | "command"
  | "extension-editor-text"
  | "queued-message-edit";

export interface NotificationPreferences {
  readonly backgroundCompletion: boolean;
  readonly backgroundFailure: boolean;
  readonly attentionNeeded: boolean;
}

export interface GlobalPlanningPreferences {
  readonly phaseModels: WorkflowPhaseModelPreferences;
}

export interface ComposerImageAttachment {
  readonly id: string;
  readonly kind: "image";
  readonly name: string;
  readonly mimeType: string;
  readonly data: string;
}

export interface ComposerFileAttachment {
  readonly id: string;
  readonly kind: "file";
  readonly name: string;
  readonly mimeType: string;
  readonly fsPath: string;
  readonly sizeBytes?: number;
}

export type ComposerAttachment = ComposerImageAttachment | ComposerFileAttachment;

export type QueuedComposerMessageMode = "steer" | "followUp";

export interface QueuedComposerMessage {
  readonly id: string;
  readonly mode: QueuedComposerMessageMode;
  readonly text: string;
  readonly attachments: readonly ComposerAttachment[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SessionRecord {
  readonly id: string;
  readonly title: string;
  readonly updatedAt: string;
  readonly lastViewedAt?: string;
  readonly archivedAt?: string;
  readonly preview: string;
  readonly status: SessionStatus;
  readonly runningSince?: string;
  readonly hasUnseenUpdate: boolean;
  readonly config?: SessionConfig;
}

export interface SelectedTranscriptRecord {
  readonly workspaceId: string;
  readonly sessionId: string;
  readonly transcript: readonly TranscriptMessage[];
}

export interface WorktreeRecord {
  readonly id: string;
  readonly rootWorkspaceId: string;
  readonly linkedWorkspaceId?: string;
  readonly name: string;
  readonly path: string;
  readonly status: WorktreeStatus;
  readonly branchName?: string;
  readonly updatedAt: string;
}

export interface SessionExtensionStatusRecord {
  readonly key: string;
  readonly text: string;
}

export interface SessionExtensionWidgetRecord {
  readonly key: string;
  readonly lines: readonly string[];
  readonly placement: "aboveComposer" | "belowComposer";
}

export type SessionExtensionDialogRecord = Extract<
  HostUiRequest,
  { readonly kind: "confirm" | "select" | "input" | "editor" }
>;

export interface SessionExtensionUiStateRecord {
  readonly statuses: readonly SessionExtensionStatusRecord[];
  readonly widgets: readonly SessionExtensionWidgetRecord[];
  readonly pendingDialogs: readonly SessionExtensionDialogRecord[];
  readonly title?: string;
  readonly editorText?: string;
}

export type ExtensionCommandCompatibilityStatus = "supported" | "terminal-only";

export interface ExtensionCommandCompatibilityRecord {
  readonly commandName: string;
  readonly extensionPath: string;
  readonly status: ExtensionCommandCompatibilityStatus;
  readonly message: string;
  readonly capability: string;
  readonly updatedAt: string;
}

export interface WorkspaceRecord {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly lastOpenedAt: string;
  readonly kind: WorkspaceKind;
  readonly rootWorkspaceId?: string;
  readonly branchName?: string;
  readonly sessions: readonly SessionRecord[];
}

export interface CreateWorktreeInput {
  readonly workspaceId: string;
  readonly fromSessionWorkspaceId?: string;
  readonly fromSessionId?: string;
}

export type StartThreadInput = {
  readonly rootWorkspaceId: string;
  readonly environment: NewThreadEnvironment;
  readonly prompt?: string;
  readonly attachments?: readonly ComposerAttachment[];
  readonly provider?: string;
  readonly modelId?: string;
  readonly thinkingLevel?: string;
};

export interface RemoveWorktreeInput {
  readonly workspaceId: string;
  readonly worktreeId: string;
}

export interface WorkspacePlanningState {
  readonly workspaceId: string;
  readonly selectedPlanId: string;
  readonly plans: readonly PlanListEntry[];
  readonly selectedPlan?: PlanSnapshot;
  readonly databasePath?: string;
  readonly projectionSummary?: PlanningProjectionSummary;
  readonly loadedAt: string;
}

export interface PlanningProjectionSummary {
  readonly generatedAt: string;
  readonly written: number;
  readonly skipped: number;
  readonly conflicts: readonly string[];
}

export interface CreatePlanningPlanInput {
  readonly workspaceId: string;
  readonly name: string;
}

export interface SelectPlanningPlanInput {
  readonly workspaceId: string;
  readonly planId: string;
}

export interface ApplyPlanningWorkflowPreferencesInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
}

export interface UpdatePlanningWorkflowPreferencesInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly preferences: Omit<WorkflowPreferencesRecord, "capturedAt">;
}

export interface SetGlobalPlanningPhaseModelsInput {
  readonly phaseModels: WorkflowPhaseModelPreferences;
}

export interface RecordPlanningAnswerInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly stage: PlanStage;
  readonly questionId: string;
  readonly prompt: string;
  readonly answer: string;
  readonly loadBearing: boolean;
  readonly discretionRationale?: string;
  readonly projectPatch?: Partial<ProjectSummary>;
}

export interface ParkPlanningIdeaInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly sourceStage: PlanStage;
  readonly sourceQuestionId: string;
  readonly sourcePrompt: string;
  readonly text: string;
  readonly rationale?: string;
}

export interface RevisePlanningAnswerInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly answerId: string;
  readonly answer: string;
  readonly rationale?: string;
  readonly projectPatch?: Partial<ProjectSummary>;
}

export interface UpsertPlanningRequirementsInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly requirements: readonly RequirementRecord[];
}

export interface ReviewPlanningIdeaInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly itemId: string;
  readonly status: ParkedItemReviewStatus;
  readonly note?: string;
}

export interface UpdatePlanningIdeaInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly itemId: string;
  readonly text: string;
}

export interface DraftPlanningChangeProposalInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly sourceParkedItemId: string;
  readonly title: string;
  readonly summary: string;
  readonly impactNotes: string;
}

export interface WithdrawPlanningChangeProposalInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly proposalId: string;
}

export interface UpdatePlanningChangeProposalInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly proposalId: string;
  readonly title: string;
  readonly summary: string;
  readonly impactNotes: string;
}

export interface ApprovePlanningChangeProposalInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly proposalId: string;
  readonly targetMilestoneId: string;
  readonly targetSliceId: string;
  readonly taskId: string;
  readonly taskTitle: string;
  readonly taskAcceptance: string;
  readonly dependencies: readonly string[];
}

export interface ApprovePlanningTaskModificationInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly proposalId: string;
  readonly taskPath: string;
  readonly taskTitle: string;
  readonly taskAcceptance: string;
  readonly dependencies: readonly string[];
}

export interface HidePlanningTaskInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly taskPath: string;
  readonly reason: string;
}

export interface RestorePlanningTaskInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly taskPath: string;
}

export interface ConfirmPlanningStageInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly stage: PlanStage;
}

export interface StartPlanningResearchInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
}

export interface ProposePlanningResearchInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly title: string;
  readonly content: string;
}

export interface ReviewPlanningResearchInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly outputId: string;
  readonly status: "accepted" | "rejected";
}

export interface PlanningTaskDraft {
  readonly id: string;
  readonly title: string;
  readonly acceptance: string;
  readonly dependencies: readonly string[];
}

export interface PlanningPhaseDraft {
  readonly id: string;
  readonly title: string;
  readonly goal: string;
}

export interface PlanningSliceDraft {
  readonly id: string;
  readonly title: string;
  readonly goal: string;
  readonly boundary: string;
  readonly tasks: readonly PlanningTaskDraft[];
}

export interface PlanningMilestoneDraft {
  readonly id: string;
  readonly title: string;
  readonly phase: string;
  readonly outcome: string;
  readonly slices: readonly PlanningSliceDraft[];
}

export interface PlanningPlanProposalDraft {
  readonly version: 1;
  readonly boundaryMap: string;
  readonly ideaPool: string;
  readonly phases: readonly PlanningPhaseDraft[];
  readonly milestones: readonly PlanningMilestoneDraft[];
}

export interface PlanningValidationIssue {
  readonly id: string;
  readonly path: string;
  readonly message: string;
}

export interface StartPlanningPlanInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
}

export interface StartPlanningExecutionInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
}

export interface LinkPlanningTaskSessionInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly taskId: string;
  readonly taskPath: string;
  readonly taskTitle: string;
}

export interface UpdatePlanningTaskExecutionInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly taskId: string;
  readonly taskPath: string;
  readonly status: TaskExecutionStatus;
  readonly note: string;
  readonly blocker: string;
  readonly evidence: string;
}

export interface StartPlanningVerifyInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
}

export interface RecordPlanningTaskVerificationInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly taskId: string;
  readonly taskPath: string;
  readonly status: TaskVerificationStatus;
  readonly note: string;
}

export interface StartPlanningShipInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
}

export interface RecordPlanningShipSummaryInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly summary: string;
}

export interface ProposePlanningPlanInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly proposal: PlanningPlanProposalDraft;
}

export interface ReviewPlanningPlanInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly expectedRevision: number;
  readonly outputId: string;
  readonly status: "accepted" | "rejected";
}

export interface RegeneratePlanningProjectionsInput {
  readonly workspaceId: string;
  readonly planId: string;
  readonly allowLegacyOverwrite?: boolean;
}

export interface DesktopAppState {
  readonly workspaces: readonly WorkspaceRecord[];
  readonly worktreesByWorkspace: Readonly<Record<string, readonly WorktreeRecord[]>>;
  readonly planningByWorkspace: Readonly<Record<string, WorkspacePlanningState>>;
  readonly selectedWorkspaceId: string;
  readonly selectedSessionId: string;
  readonly activeView: AppView;
  readonly composerDraft: string;
  readonly composerDraftSyncSource: ComposerDraftSyncSource;
  readonly composerDraftSyncNonce: number;
  readonly composerAttachments: readonly ComposerAttachment[];
  readonly queuedComposerMessages: readonly QueuedComposerMessage[];
  readonly editingQueuedMessageId?: string;
  readonly runtimeByWorkspace: Readonly<Record<string, RuntimeSnapshot>>;
  readonly sessionCommandsBySession: Readonly<Record<string, readonly RuntimeCommandRecord[]>>;
  readonly sessionExtensionUiBySession: Readonly<Record<string, SessionExtensionUiStateRecord>>;
  readonly extensionCommandCompatibilityByWorkspace: Readonly<Record<string, readonly ExtensionCommandCompatibilityRecord[]>>;
  readonly notificationPreferences: NotificationPreferences;
  readonly globalPlanningPreferences: GlobalPlanningPreferences;
  readonly integratedTerminalShell: string;
  readonly lastViewedAtBySession: Readonly<Record<string, string>>;
  readonly workspaceOrder: readonly string[];
  readonly modelSettingsScopeMode: ModelSettingsScopeMode;
  readonly globalModelSettings: ModelSettingsSnapshot;
  readonly sidebarCollapsed: boolean;
  readonly revision: number;
  readonly lastError?: string;
}

export interface CreateSessionInput {
  readonly workspaceId: string;
  readonly title?: string;
}

export interface WorkspaceSessionTarget {
  readonly workspaceId: string;
  readonly sessionId: string;
}

export function createEmptyDesktopAppState(): DesktopAppState {
  return {
    workspaces: [],
    worktreesByWorkspace: {},
    planningByWorkspace: {},
    selectedWorkspaceId: "",
    selectedSessionId: "",
    activeView: "threads",
    composerDraft: "",
    composerDraftSyncSource: "state",
    composerDraftSyncNonce: 0,
    composerAttachments: [],
    queuedComposerMessages: [],
    runtimeByWorkspace: {},
    sessionCommandsBySession: {},
    sessionExtensionUiBySession: {},
    extensionCommandCompatibilityByWorkspace: {},
    notificationPreferences: {
      backgroundCompletion: true,
      backgroundFailure: true,
      attentionNeeded: true,
    },
    globalPlanningPreferences: {
      phaseModels: {},
    },
    integratedTerminalShell: "",
    lastViewedAtBySession: {},
    workspaceOrder: [],
    modelSettingsScopeMode: "app-global",
    globalModelSettings: {
      enabledModelPatterns: [],
    },
    sidebarCollapsed: false,
    revision: 0,
  };
}

export function getSelectedWorkspace(state: DesktopAppState): WorkspaceRecord | undefined {
  return state.workspaces.find((workspace) => workspace.id === state.selectedWorkspaceId);
}

export function getSelectedSession(state: DesktopAppState): SessionRecord | undefined {
  return getSelectedWorkspace(state)?.sessions.find((session) => session.id === state.selectedSessionId);
}
