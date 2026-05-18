import type { RuntimeSettingsSnapshot } from "@pi-gui/session-driver/runtime-types";
import type {
  NavigateSessionTreeOptions,
  NavigateSessionTreeResult,
  SessionTreeSnapshot,
} from "@pi-gui/session-driver/types";
import type {
  AppView,
  ApplyPlanningWorkflowPreferencesInput,
  ApprovePlanningChangeProposalInput,
  ApprovePlanningTaskModificationInput,
  ComposerAttachment,
  ComposerImageAttachment,
  ConfirmPlanningStageInput,
  CreatePlanningPlanInput,
  CreateSessionInput,
  CreateWorktreeInput,
  DesktopAppState,
  DraftPlanningChangeProposalInput,
  HidePlanningTaskInput,
  LinkPlanningTaskSessionInput,
  ModelSettingsScopeMode,
  NotificationPreferences,
  ParkPlanningIdeaInput,
  ProposePlanningPlanInput,
  ProposePlanningResearchInput,
  RecordPlanningAnswerInput,
  RecordPlanningShipSummaryInput,
  RecordPlanningTaskVerificationInput,
  RegeneratePlanningProjectionsInput,
  ReviewPlanningIdeaInput,
  ReviewPlanningPlanInput,
  ReviewPlanningResearchInput,
  RestorePlanningTaskInput,
  RemoveWorktreeInput,
  RevisePlanningAnswerInput,
  SelectedTranscriptRecord,
  SelectPlanningPlanInput,
  StartPlanningExecutionInput,
  StartPlanningPlanInput,
  StartPlanningResearchInput,
  StartPlanningShipInput,
  StartPlanningVerifyInput,
  StartThreadInput,
  SetGlobalPlanningPhaseModelsInput,
  UpdatePlanningChangeProposalInput,
  UpdatePlanningIdeaInput,
  UpdatePlanningPlanStatusInput,
  UpdatePlanningWorkflowPreferencesInput,
  UpdatePlanningTaskExecutionInput,
  UpsertPlanningRequirementsInput,
  WithdrawPlanningChangeProposalInput,
  WorkspaceSessionTarget,
} from "./desktop-state";

export type DesktopNotificationPermissionStatus =
  | "granted"
  | "denied"
  | "default"
  | "unsupported"
  | "unknown";

export const desktopIpc = {
  stateRequest: "pi-gui:state-request",
  stateChanged: "pi-gui:state-changed",
  selectedTranscriptRequest: "pi-gui:selected-transcript-request",
  selectedTranscriptChanged: "pi-gui:selected-transcript-changed",
  appCommand: "pi-gui:app-command",
  workspacePicked: "pi-gui:workspace-picked",
  clipboardImagePasted: "pi-gui:clipboard-image-pasted",
  addWorkspacePath: "pi-gui:add-workspace-path",
  pickWorkspace: "pi-gui:pick-workspace",
  selectWorkspace: "pi-gui:select-workspace",
  renameWorkspace: "pi-gui:rename-workspace",
  removeWorkspace: "pi-gui:remove-workspace",
  reorderWorkspaces: "pi-gui:reorder-workspaces",
  openWorkspaceInFinder: "pi-gui:open-workspace-in-finder",
  createWorktree: "pi-gui:create-worktree",
  removeWorktree: "pi-gui:remove-worktree",
  openSkillInFinder: "pi-gui:open-skill-in-finder",
  openExtensionInFinder: "pi-gui:open-extension-in-finder",
  loadPlanningWorkspace: "pi-gui:load-planning-workspace",
  createPlanningPlan: "pi-gui:create-planning-plan",
  selectPlanningPlan: "pi-gui:select-planning-plan",
  updatePlanningPlanStatus: "pi-gui:update-planning-plan-status",
  applyPlanningWorkflowPreferences: "pi-gui:apply-planning-workflow-preferences",
  updatePlanningWorkflowPreferences: "pi-gui:update-planning-workflow-preferences",
  recordPlanningAnswer: "pi-gui:record-planning-answer",
  parkPlanningIdea: "pi-gui:park-planning-idea",
  revisePlanningAnswer: "pi-gui:revise-planning-answer",
  upsertPlanningRequirements: "pi-gui:upsert-planning-requirements",
  reviewPlanningIdea: "pi-gui:review-planning-idea",
  updatePlanningIdea: "pi-gui:update-planning-idea",
  draftPlanningChangeProposal: "pi-gui:draft-planning-change-proposal",
  withdrawPlanningChangeProposal: "pi-gui:withdraw-planning-change-proposal",
  updatePlanningChangeProposal: "pi-gui:update-planning-change-proposal",
  approvePlanningChangeProposal: "pi-gui:approve-planning-change-proposal",
  approvePlanningTaskModification: "pi-gui:approve-planning-task-modification",
  hidePlanningTask: "pi-gui:hide-planning-task",
  restorePlanningTask: "pi-gui:restore-planning-task",
  confirmPlanningStage: "pi-gui:confirm-planning-stage",
  startPlanningResearch: "pi-gui:start-planning-research",
  proposePlanningResearch: "pi-gui:propose-planning-research",
  reviewPlanningResearch: "pi-gui:review-planning-research",
  startPlanningPlan: "pi-gui:start-planning-plan",
  proposePlanningPlan: "pi-gui:propose-planning-plan",
  reviewPlanningPlan: "pi-gui:review-planning-plan",
  startPlanningExecution: "pi-gui:start-planning-execution",
  linkPlanningTaskSession: "pi-gui:link-planning-task-session",
  updatePlanningTaskExecution: "pi-gui:update-planning-task-execution",
  startPlanningVerify: "pi-gui:start-planning-verify",
  recordPlanningTaskVerification: "pi-gui:record-planning-task-verification",
  startPlanningShip: "pi-gui:start-planning-ship",
  recordPlanningShipSummary: "pi-gui:record-planning-ship-summary",
  regeneratePlanningProjections: "pi-gui:regenerate-planning-projections",
  syncCurrentWorkspace: "pi-gui:sync-current-workspace",
  selectSession: "pi-gui:select-session",
  archiveSession: "pi-gui:archive-session",
  unarchiveSession: "pi-gui:unarchive-session",
  createSession: "pi-gui:create-session",
  startThread: "pi-gui:start-thread",
  cancelCurrentRun: "pi-gui:cancel-current-run",
  setActiveView: "pi-gui:set-active-view",
  setSidebarCollapsed: "pi-gui:set-sidebar-collapsed",
  refreshRuntime: "pi-gui:refresh-runtime",
  setModelSettingsScopeMode: "pi-gui:set-model-settings-scope-mode",
  setGlobalPlanningPhaseModels: "pi-gui:set-global-planning-phase-models",
  setDefaultModel: "pi-gui:set-default-model",
  setDefaultThinkingLevel: "pi-gui:set-default-thinking-level",
  setSessionModel: "pi-gui:set-session-model",
  setSessionThinkingLevel: "pi-gui:set-session-thinking-level",
  loginProvider: "pi-gui:login-provider",
  logoutProvider: "pi-gui:logout-provider",
  setProviderApiKey: "pi-gui:set-provider-api-key",
  setEnableSkillCommands: "pi-gui:set-enable-skill-commands",
  setScopedModelPatterns: "pi-gui:set-scoped-model-patterns",
  setSkillEnabled: "pi-gui:set-skill-enabled",
  setExtensionEnabled: "pi-gui:set-extension-enabled",
  respondToHostUiRequest: "pi-gui:respond-to-host-ui-request",
  setNotificationPreferences: "pi-gui:set-notification-preferences",
  setIntegratedTerminalShell: "pi-gui:set-integrated-terminal-shell",
  terminalEnsurePanel: "pi-gui:terminal-ensure-panel",
  terminalCreateSession: "pi-gui:terminal-create-session",
  terminalSetActiveSession: "pi-gui:terminal-set-active-session",
  terminalWrite: "pi-gui:terminal-write",
  terminalResize: "pi-gui:terminal-resize",
  terminalRestartSession: "pi-gui:terminal-restart-session",
  terminalCloseSession: "pi-gui:terminal-close-session",
  terminalSetTitle: "pi-gui:terminal-set-title",
  terminalSetFocused: "pi-gui:terminal-set-focused",
  terminalData: "pi-gui:terminal-data",
  terminalExit: "pi-gui:terminal-exit",
  terminalError: "pi-gui:terminal-error",
  getNotificationPermissionStatus: "pi-gui:get-notification-permission-status",
  requestNotificationPermission: "pi-gui:request-notification-permission",
  openSystemNotificationSettings: "pi-gui:open-system-notification-settings",
  notificationPermissionStatusChanged: "pi-gui:notification-permission-status-changed",
  pickComposerAttachments: "pi-gui:pick-composer-attachments",
  readClipboardImage: "pi-gui:read-clipboard-image",
  addComposerAttachments: "pi-gui:add-composer-attachments",
  removeComposerAttachment: "pi-gui:remove-composer-attachment",
  editQueuedComposerMessage: "pi-gui:edit-queued-composer-message",
  cancelQueuedComposerEdit: "pi-gui:cancel-queued-composer-edit",
  removeQueuedComposerMessage: "pi-gui:remove-queued-composer-message",
  steerQueuedComposerMessage: "pi-gui:steer-queued-composer-message",
  updateComposerDraft: "pi-gui:update-composer-draft",
  submitComposer: "pi-gui:submit-composer",
  getSessionTree: "pi-gui:get-session-tree",
  navigateSessionTree: "pi-gui:navigate-session-tree",
  toggleWindowMaximize: "pi-gui:toggle-window-maximize",
  listWorkspaceFiles: "pi-gui:list-workspace-files",
  getChangedFiles: "pi-gui:get-changed-files",
  getFileDiff: "pi-gui:get-file-diff",
  stageFile: "pi-gui:stage-file",
  getThemeMode: "pi-gui:get-theme-mode",
  getResolvedTheme: "pi-gui:get-resolved-theme",
  setThemeMode: "pi-gui:set-theme-mode",
  themeChanged: "pi-gui:theme-changed",
  ping: "app:ping",
  openExternal: "app:open-external",
} as const;

export const desktopCommands = {
  openSettings: "open-settings",
  openNewThread: "open-new-thread",
  toggleTerminal: "toggle-terminal",
  toggleSidebar: "toggle-sidebar",
} as const;

export function getDesktopShortcutLabel(platform: NodeJS.Platform, key: string): string {
  return `${platform === "darwin" ? "⌘" : "Ctrl+"}${key.toUpperCase()}`;
}

export type PiDesktopStateListener = (state: DesktopAppState) => void;
export type PiDesktopSelectedTranscriptListener = (payload: SelectedTranscriptRecord | null) => void;
export type PiDesktopCommand = (typeof desktopCommands)[keyof typeof desktopCommands];

export interface TerminalSize {
  readonly cols: number;
  readonly rows: number;
}

export type TerminalSessionStatus = "running" | "exited" | "error";

export interface TerminalSessionSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly cwd: string;
  readonly shell: string;
  readonly title: string;
  readonly status: TerminalSessionStatus;
  readonly replay: string;
  readonly truncated: boolean;
  readonly exitCode?: number;
  readonly signal?: number;
}

export interface TerminalPanelSnapshot {
  readonly workspaceId: string;
  readonly rootKey: string;
  readonly activeSessionId: string;
  readonly sessions: readonly TerminalSessionSnapshot[];
}

export interface TerminalDataEvent {
  readonly terminalId: string;
  readonly data: string;
}

export interface TerminalExitEvent {
  readonly terminalId: string;
  readonly exitCode?: number;
  readonly signal?: number;
}

export interface TerminalErrorEvent {
  readonly terminalId: string;
  readonly message: string;
}

export interface DesktopShortcutInput {
  readonly modifier: boolean;
  readonly shift: boolean;
  readonly key: string;
  readonly code?: string;
}

export function getDesktopCommandFromShortcut(input: DesktopShortcutInput): PiDesktopCommand | undefined {
  if (!input.modifier) {
    return undefined;
  }

  const lowerKey = input.key.toLowerCase();
  const isComma = input.key === "," || input.code === "Comma";
  const isB = lowerKey === "b" || input.code === "KeyB";
  const isJ = lowerKey === "j" || input.code === "KeyJ";
  const isShiftO = input.shift && (lowerKey === "o" || input.code === "KeyO");

  if (!input.shift && isComma) {
    return desktopCommands.openSettings;
  }

  if (!input.shift && isJ) {
    return desktopCommands.toggleTerminal;
  }

  if (!input.shift && isB) {
    return desktopCommands.toggleSidebar;
  }

  if (isShiftO) {
    return desktopCommands.openNewThread;
  }

  return undefined;
}

export interface PiDesktopApi {
  platform: NodeJS.Platform;
  versions: NodeJS.ProcessVersions;
  ping(): Promise<string>;
  getState(): Promise<DesktopAppState>;
  onStateChanged(listener: PiDesktopStateListener): () => void;
  getSelectedTranscript(): Promise<SelectedTranscriptRecord | null>;
  onSelectedTranscriptChanged(listener: PiDesktopSelectedTranscriptListener): () => void;
  onCommand(listener: (command: PiDesktopCommand) => void): () => void;
  onWorkspacePicked(listener: (workspaceId: string) => void): () => void;
  onClipboardImagePasted(listener: (attachment: ComposerImageAttachment) => void): () => void;
  getPathForFile(file: File): string;
  addWorkspacePath(path: string): Promise<DesktopAppState>;
  pickWorkspace(): Promise<DesktopAppState>;
  selectWorkspace(workspaceId: string): Promise<DesktopAppState>;
  renameWorkspace(workspaceId: string, displayName: string): Promise<DesktopAppState>;
  removeWorkspace(workspaceId: string): Promise<DesktopAppState>;
  reorderWorkspaces(workspaceOrder: readonly string[]): Promise<DesktopAppState>;
  openWorkspaceInFinder(workspaceId: string): Promise<void>;
  createWorktree(input: CreateWorktreeInput): Promise<DesktopAppState>;
  removeWorktree(input: RemoveWorktreeInput): Promise<DesktopAppState>;
  openSkillInFinder(workspaceId: string, filePath: string): Promise<void>;
  openExtensionInFinder(workspaceId: string, filePath: string): Promise<void>;
  loadPlanningWorkspace(workspaceId: string): Promise<DesktopAppState>;
  createPlanningPlan(input: CreatePlanningPlanInput): Promise<DesktopAppState>;
  selectPlanningPlan(input: SelectPlanningPlanInput): Promise<DesktopAppState>;
  updatePlanningPlanStatus(input: UpdatePlanningPlanStatusInput): Promise<DesktopAppState>;
  applyPlanningWorkflowPreferences(input: ApplyPlanningWorkflowPreferencesInput): Promise<DesktopAppState>;
  updatePlanningWorkflowPreferences(input: UpdatePlanningWorkflowPreferencesInput): Promise<DesktopAppState>;
  recordPlanningAnswer(input: RecordPlanningAnswerInput): Promise<DesktopAppState>;
  parkPlanningIdea(input: ParkPlanningIdeaInput): Promise<DesktopAppState>;
  revisePlanningAnswer(input: RevisePlanningAnswerInput): Promise<DesktopAppState>;
  upsertPlanningRequirements(input: UpsertPlanningRequirementsInput): Promise<DesktopAppState>;
  reviewPlanningIdea(input: ReviewPlanningIdeaInput): Promise<DesktopAppState>;
  updatePlanningIdea(input: UpdatePlanningIdeaInput): Promise<DesktopAppState>;
  draftPlanningChangeProposal(input: DraftPlanningChangeProposalInput): Promise<DesktopAppState>;
  withdrawPlanningChangeProposal(input: WithdrawPlanningChangeProposalInput): Promise<DesktopAppState>;
  updatePlanningChangeProposal(input: UpdatePlanningChangeProposalInput): Promise<DesktopAppState>;
  approvePlanningChangeProposal(input: ApprovePlanningChangeProposalInput): Promise<DesktopAppState>;
  approvePlanningTaskModification(input: ApprovePlanningTaskModificationInput): Promise<DesktopAppState>;
  hidePlanningTask(input: HidePlanningTaskInput): Promise<DesktopAppState>;
  restorePlanningTask(input: RestorePlanningTaskInput): Promise<DesktopAppState>;
  confirmPlanningStage(input: ConfirmPlanningStageInput): Promise<DesktopAppState>;
  startPlanningResearch(input: StartPlanningResearchInput): Promise<DesktopAppState>;
  proposePlanningResearch(input: ProposePlanningResearchInput): Promise<DesktopAppState>;
  reviewPlanningResearch(input: ReviewPlanningResearchInput): Promise<DesktopAppState>;
  startPlanningPlan(input: StartPlanningPlanInput): Promise<DesktopAppState>;
  proposePlanningPlan(input: ProposePlanningPlanInput): Promise<DesktopAppState>;
  reviewPlanningPlan(input: ReviewPlanningPlanInput): Promise<DesktopAppState>;
  startPlanningExecution(input: StartPlanningExecutionInput): Promise<DesktopAppState>;
  linkPlanningTaskSession(input: LinkPlanningTaskSessionInput): Promise<DesktopAppState>;
  updatePlanningTaskExecution(input: UpdatePlanningTaskExecutionInput): Promise<DesktopAppState>;
  startPlanningVerify(input: StartPlanningVerifyInput): Promise<DesktopAppState>;
  recordPlanningTaskVerification(input: RecordPlanningTaskVerificationInput): Promise<DesktopAppState>;
  startPlanningShip(input: StartPlanningShipInput): Promise<DesktopAppState>;
  recordPlanningShipSummary(input: RecordPlanningShipSummaryInput): Promise<DesktopAppState>;
  regeneratePlanningProjections(input: RegeneratePlanningProjectionsInput): Promise<DesktopAppState>;
  syncCurrentWorkspace(): Promise<DesktopAppState>;
  selectSession(target: WorkspaceSessionTarget): Promise<DesktopAppState>;
  archiveSession(target: WorkspaceSessionTarget): Promise<DesktopAppState>;
  unarchiveSession(target: WorkspaceSessionTarget): Promise<DesktopAppState>;
  createSession(input: CreateSessionInput): Promise<DesktopAppState>;
  startThread(input: StartThreadInput): Promise<DesktopAppState>;
  cancelCurrentRun(): Promise<DesktopAppState>;
  setActiveView(view: AppView): Promise<DesktopAppState>;
  setSidebarCollapsed(collapsed: boolean): Promise<DesktopAppState>;
  refreshRuntime(workspaceId?: string): Promise<DesktopAppState>;
  setModelSettingsScopeMode(mode: ModelSettingsScopeMode): Promise<DesktopAppState>;
  setGlobalPlanningPhaseModels(input: SetGlobalPlanningPhaseModelsInput): Promise<DesktopAppState>;
  setDefaultModel(workspaceId: string, provider: string, modelId: string): Promise<DesktopAppState>;
  setDefaultThinkingLevel(
    workspaceId: string,
    thinkingLevel: RuntimeSettingsSnapshot["defaultThinkingLevel"],
  ): Promise<DesktopAppState>;
  setSessionModel(
    workspaceId: string,
    sessionId: string,
    provider: string,
    modelId: string,
  ): Promise<DesktopAppState>;
  setSessionThinkingLevel(
    workspaceId: string,
    sessionId: string,
    thinkingLevel: NonNullable<RuntimeSettingsSnapshot["defaultThinkingLevel"]>,
  ): Promise<DesktopAppState>;
  loginProvider(workspaceId: string, providerId: string): Promise<DesktopAppState>;
  logoutProvider(workspaceId: string, providerId: string): Promise<DesktopAppState>;
  setProviderApiKey(workspaceId: string, providerId: string, apiKey: string): Promise<DesktopAppState>;
  setEnableSkillCommands(workspaceId: string, enabled: boolean): Promise<DesktopAppState>;
  setScopedModelPatterns(workspaceId: string, patterns: readonly string[]): Promise<DesktopAppState>;
  setSkillEnabled(workspaceId: string, filePath: string, enabled: boolean): Promise<DesktopAppState>;
  setExtensionEnabled(workspaceId: string, filePath: string, enabled: boolean): Promise<DesktopAppState>;
  respondToHostUiRequest(
    workspaceId: string,
    sessionId: string,
    response:
      | { readonly requestId: string; readonly value: string }
      | { readonly requestId: string; readonly confirmed: boolean }
      | { readonly requestId: string; readonly cancelled: true },
  ): Promise<DesktopAppState>;
  setNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<DesktopAppState>;
  setIntegratedTerminalShell(shell: string): Promise<DesktopAppState>;
  ensureTerminalPanel(
    workspaceId: string,
    terminalScopeId: string,
    size?: Partial<TerminalSize>,
  ): Promise<TerminalPanelSnapshot>;
  createTerminalSession(
    workspaceId: string,
    terminalScopeId: string,
    size?: Partial<TerminalSize>,
  ): Promise<TerminalPanelSnapshot>;
  setActiveTerminalSession(
    workspaceId: string,
    terminalScopeId: string,
    terminalId: string,
  ): Promise<TerminalPanelSnapshot>;
  writeTerminal(terminalId: string, data: string): Promise<void>;
  resizeTerminal(terminalId: string, size: TerminalSize): Promise<void>;
  restartTerminalSession(terminalId: string, size?: Partial<TerminalSize>): Promise<TerminalPanelSnapshot>;
  closeTerminalSession(terminalId: string): Promise<TerminalPanelSnapshot | null>;
  setTerminalTitle(terminalId: string, title: string): Promise<void>;
  setTerminalFocused(focused: boolean): Promise<void>;
  onTerminalData(listener: (event: TerminalDataEvent) => void): () => void;
  onTerminalExit(listener: (event: TerminalExitEvent) => void): () => void;
  onTerminalError(listener: (event: TerminalErrorEvent) => void): () => void;
  getNotificationPermissionStatus(): Promise<DesktopNotificationPermissionStatus>;
  requestNotificationPermission(): Promise<DesktopNotificationPermissionStatus>;
  openSystemNotificationSettings(): Promise<void>;
  onNotificationPermissionStatusChanged(
    callback: (status: DesktopNotificationPermissionStatus) => void,
  ): () => void;
  pickComposerAttachments(): Promise<DesktopAppState>;
  readClipboardImage(): ComposerImageAttachment | null;
  addComposerAttachments(attachments: readonly ComposerAttachment[]): Promise<DesktopAppState>;
  removeComposerAttachment(attachmentId: string): Promise<DesktopAppState>;
  editQueuedComposerMessage(messageId: string, currentDraft?: string): Promise<DesktopAppState>;
  cancelQueuedComposerEdit(): Promise<DesktopAppState>;
  removeQueuedComposerMessage(messageId: string): Promise<DesktopAppState>;
  steerQueuedComposerMessage(messageId: string): Promise<DesktopAppState>;
  updateComposerDraft(composerDraft: string): Promise<DesktopAppState>;
  submitComposer(text: string, options?: { readonly deliverAs?: "steer" | "followUp" }): Promise<DesktopAppState>;
  getSessionTree(target: WorkspaceSessionTarget): Promise<SessionTreeSnapshot>;
  navigateSessionTree(
    target: WorkspaceSessionTarget,
    targetId: string,
    options?: NavigateSessionTreeOptions,
  ): Promise<{ readonly state: DesktopAppState; readonly result: NavigateSessionTreeResult }>;
  listWorkspaceFiles(workspaceId: string): Promise<string[]>;
  getChangedFiles(workspaceId: string): Promise<{ path: string; status: "added" | "modified" | "deleted" | "untracked"; staged: boolean }[]>;
  getFileDiff(workspaceId: string, filePath: string): Promise<string>;
  stageFile(workspaceId: string, filePath: string): Promise<void>;
  toggleWindowMaximize(): Promise<void>;
  openExternal(url: string): Promise<void>;
  getThemeMode(): Promise<"system" | "light" | "dark">;
  getResolvedTheme(): Promise<"light" | "dark">;
  setThemeMode(mode: "system" | "light" | "dark"): Promise<string>;
  onThemeChanged(callback: (theme: "light" | "dark") => void): () => void;
}
