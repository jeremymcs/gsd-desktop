import { useEffect, useRef, type ClipboardEvent, type DragEvent, type KeyboardEvent, type RefObject } from "react";
import type { RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import gsdLogoUrl from "./assets/gsd-logo-transparent.svg";
import type { ComposerAttachment, NewThreadEnvironment, WorkspaceRecord } from "./desktop-state";
import { ArrowUpIcon, ChevronRightIcon, PlanIcon, PlusIcon, SparkIcon, StatusIcon } from "./icons";
import {
  MODEL_OPTIONS_EMPTY_TITLE,
  type ComposerSlashCommand,
  type ComposerSlashCommandSection,
  type ComposerSlashOption,
  type ComposerSlashOptionEmptyState,
} from "./composer-commands";
import { ComposerSurface } from "./composer-surface";
import { ModelOnboardingNoticeBanner } from "./model-onboarding-notice";
import type { ModelOnboardingState, ModelOnboardingSettingsSection } from "./model-onboarding";
import { ModelSelector } from "./model-selector";

interface NewThreadViewProps {
  readonly workspaces: readonly WorkspaceRecord[];
  readonly selectedWorkspaceId: string;
  readonly runtime?: RuntimeSnapshot;
  readonly environment: NewThreadEnvironment;
  readonly prompt: string;
  readonly attachments: readonly ComposerAttachment[];
  readonly lastError?: string;
  readonly provider: string | undefined;
  readonly modelId: string | undefined;
  readonly thinkingLevel: string | undefined;
  readonly modelOnboarding: ModelOnboardingState;
  readonly composerRef: RefObject<HTMLTextAreaElement | null>;
  readonly activeSlashCommand?: ComposerSlashCommand;
  readonly activeSlashCommandMeta?: string;
  readonly slashSections: readonly ComposerSlashCommandSection[];
  readonly slashOptions: readonly ComposerSlashOption[];
  readonly selectedSlashCommand?: ComposerSlashCommand;
  readonly selectedSlashOption?: ComposerSlashOption;
  readonly showSlashMenu: boolean;
  readonly showSlashOptionMenu: boolean;
  readonly slashOptionEmptyState?: ComposerSlashOptionEmptyState;
  readonly showMentionMenu: boolean;
  readonly mentionOptions: readonly string[];
  readonly selectedMentionIndex: number;
  readonly onChangePrompt: (prompt: string) => void;
  readonly onSelectEnvironment: (environment: NewThreadEnvironment) => void;
  readonly onSelectWorkspace: (workspaceId: string) => void;
  readonly onSetModel: (provider: string, modelId: string) => void;
  readonly onSetThinking: (level: string) => void;
  readonly onOpenModelSettings: (section: ModelOnboardingSettingsSection) => void;
  readonly onComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  readonly onComposerPaste: (event: ClipboardEvent<HTMLDivElement>) => void;
  readonly onComposerDrop: (event: DragEvent<HTMLDivElement>) => void;
  readonly onClearSlashCommand: () => void;
  readonly onSelectSlashCommand: (command: ComposerSlashCommand) => void;
  readonly onSelectSlashOption: (option: ComposerSlashOption) => void;
  readonly onSelectMention: (filePath: string) => void;
  readonly onAddAttachments: (files: File[]) => void;
  readonly onRemoveAttachment: (attachmentId: string) => void;
  readonly onNewPlan: () => void;
  readonly onSubmit: () => void;
}

export function NewThreadView({
  workspaces,
  selectedWorkspaceId,
  runtime,
  environment,
  prompt,
  attachments,
  lastError,
  provider,
  modelId,
  thinkingLevel,
  modelOnboarding,
  composerRef,
  activeSlashCommand,
  activeSlashCommandMeta,
  slashSections,
  slashOptions,
  selectedSlashCommand,
  selectedSlashOption,
  showSlashMenu,
  showSlashOptionMenu,
  slashOptionEmptyState,
  showMentionMenu,
  mentionOptions,
  selectedMentionIndex,
  onChangePrompt,
  onSelectEnvironment,
  onSelectWorkspace,
  onSetModel,
  onSetThinking,
  onOpenModelSettings,
  onComposerKeyDown,
  onComposerPaste,
  onComposerDrop,
  onClearSlashCommand,
  onSelectSlashCommand,
  onSelectSlashOption,
  onSelectMention,
  onAddAttachments,
  onRemoveAttachment,
  onNewPlan,
  onSubmit,
}: NewThreadViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workspace = workspaces.find((entry) => entry.id === selectedWorkspaceId);

  useEffect(() => {
    composerRef.current?.focus();
  }, [composerRef]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) {
      return;
    }

    composer.style.height = "0px";
    composer.style.height = `${Math.min(composer.scrollHeight, 260)}px`;
  }, [composerRef, prompt]);

  if (!workspace) {
    return (
      <section className="canvas canvas--empty">
        <div className="empty-panel">
          <div className="session-header__eyebrow">New thread</div>
          <h1>Open a folder to begin</h1>
          <p>Select a repository from the sidebar first, then start a local or worktree-backed thread.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="canvas canvas--new-thread">
      <div className="new-thread">
        <div className="new-thread__hero">
          <img alt="GSD" className="new-thread__logo" data-testid="new-thread-logo" src={gsdLogoUrl} />
          <div className="new-thread__eyebrow">New GSD project</div>
          <h1 className="new-thread__title">Let's turn your idea into a clear plan.</h1>
          <p className="new-thread__subtitle">
            Share the outcome, constraints, or questions you already have. GSD will guide you from DISCUSS through SHIP.
          </p>
          <label className="new-thread__workspace-picker">
            <span className="sr-only">Workspace</span>
            <select
              className="new-thread__workspace"
              value={workspace.id}
              onChange={(event) => onSelectWorkspace(event.target.value)}
            >
              {workspaces.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="new-thread__quick-actions" aria-label="GSD start options">
          <button
            className="new-thread__quick-action"
            type="button"
            onClick={() => {
              onChangePrompt("DISCUSS: ");
              composerRef.current?.focus();
            }}
          >
            <SparkIcon />
            <span className="new-thread__quick-action-copy">
              <span className="new-thread__quick-action-title">Talk through the idea</span>
              <small>Capture goals, users, constraints, and open questions.</small>
            </span>
            <span aria-hidden="true" className="new-thread__quick-action-phase" data-testid="quick-action-phase-discuss">
              <span>01</span>
              <strong>DISCUSS</strong>
              <ChevronRightIcon />
            </span>
          </button>
          <button
            className="new-thread__quick-action"
            type="button"
            onClick={() => {
              onChangePrompt("RESEARCH: summarize this workspace before planning.");
              composerRef.current?.focus();
            }}
          >
            <StatusIcon />
            <span className="new-thread__quick-action-copy">
              <span className="new-thread__quick-action-title">Learn from this workspace</span>
              <small>Use the current codebase as context before planning.</small>
            </span>
            <span aria-hidden="true" className="new-thread__quick-action-phase" data-testid="quick-action-phase-research">
              <span>02</span>
              <strong>RESEARCH</strong>
              <ChevronRightIcon />
            </span>
          </button>
          <button aria-label="Create the guided plan" className="new-thread__quick-action" type="button" onClick={onNewPlan}>
            <PlanIcon />
            <span className="new-thread__quick-action-copy">
              <span className="new-thread__quick-action-title">Create the guided plan</span>
              <small>Shape milestones, phases, slices, and tasks.</small>
            </span>
            <span aria-hidden="true" className="new-thread__quick-action-phase" data-testid="quick-action-phase-plan">
              <span>03</span>
              <strong>PLAN</strong>
              <ChevronRightIcon />
            </span>
          </button>
        </div>

        <div className="new-thread__composer composer">
          <div className="conversation conversation--composer">
            <ComposerSurface
              lastError={lastError}
              activeSlashCommand={activeSlashCommand}
              activeSlashCommandMeta={activeSlashCommandMeta}
              topNotice={(
                <ModelOnboardingNoticeBanner notice={modelOnboarding.notice} onOpenSettings={onOpenModelSettings} />
              )}
              queuedMessages={[]}
              composerDraft={prompt}
              setComposerDraft={onChangePrompt}
              composerRef={composerRef}
              attachments={attachments}
              slashSections={slashSections}
              slashOptions={slashOptions}
              selectedSlashCommand={selectedSlashCommand}
              selectedSlashOption={selectedSlashOption}
              showSlashMenu={showSlashMenu}
              showSlashOptionMenu={showSlashOptionMenu}
              slashOptionEmptyState={slashOptionEmptyState}
              onClearSlashCommand={onClearSlashCommand}
              onComposerKeyDown={onComposerKeyDown}
              onComposerPaste={onComposerPaste}
              onComposerDrop={onComposerDrop}
              onEditQueuedMessage={() => undefined}
              onCancelQueuedEdit={() => undefined}
              onRemoveQueuedMessage={() => undefined}
              onSteerQueuedMessage={() => undefined}
              onRemoveAttachment={onRemoveAttachment}
              onSelectSlashCommand={onSelectSlashCommand}
              onSelectSlashOption={onSelectSlashOption}
              showMentionMenu={showMentionMenu}
              mentionOptions={mentionOptions}
              selectedMentionIndex={selectedMentionIndex}
              onSelectMention={onSelectMention}
              textareaLabel="New thread prompt"
              textareaTestId="new-thread-composer"
              textareaClassName="new-thread__textarea"
              textareaPlaceholder="Start with the outcome, users, constraints, or any question on your mind."
              footer={(
                <NewThreadComposerFooter
                  runtime={runtime}
                  environment={environment}
                  provider={provider}
                  modelId={modelId}
                  thinkingLevel={thinkingLevel}
                  modelOnboarding={modelOnboarding}
                  hasContent={Boolean(prompt.trim() || attachments.length > 0)}
                  fileInputRef={fileInputRef}
                  onSelectEnvironment={onSelectEnvironment}
                  onSetModel={onSetModel}
                  onSetThinking={onSetThinking}
                  onAddAttachments={onAddAttachments}
                  onSubmit={onSubmit}
                />
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface NewThreadComposerFooterProps {
  readonly runtime?: RuntimeSnapshot;
  readonly environment: NewThreadEnvironment;
  readonly provider: string | undefined;
  readonly modelId: string | undefined;
  readonly thinkingLevel: string | undefined;
  readonly modelOnboarding: ModelOnboardingState;
  readonly hasContent: boolean;
  readonly fileInputRef: RefObject<HTMLInputElement | null>;
  readonly onSelectEnvironment: (environment: NewThreadEnvironment) => void;
  readonly onSetModel: (provider: string, modelId: string) => void;
  readonly onSetThinking: (level: string) => void;
  readonly onAddAttachments: (files: File[]) => void;
  readonly onSubmit: () => void;
}

function NewThreadComposerFooter({
  runtime,
  environment,
  provider,
  modelId,
  thinkingLevel,
  modelOnboarding,
  hasContent,
  fileInputRef,
  onSelectEnvironment,
  onSetModel,
  onSetThinking,
  onAddAttachments,
  onSubmit,
}: NewThreadComposerFooterProps) {
  return (
    <>
      <div className="composer__footer">
        <div className="composer__footer-row">
          <div className="composer__hint new-thread__hint">
            <div className="new-thread__environment-group">
              <button
                className={`new-thread__environment ${environment === "local" ? "new-thread__environment--active" : ""}`}
                type="button"
                onClick={() => onSelectEnvironment("local")}
              >
                <span>Local</span>
              </button>
              <button
                className={`new-thread__environment ${environment === "worktree" ? "new-thread__environment--active" : ""}`}
                type="button"
                onClick={() => onSelectEnvironment("worktree")}
              >
                <span>Worktree</span>
              </button>
            </div>
            <ModelSelector
              runtime={runtime}
              provider={provider}
              modelId={modelId}
              thinkingLevel={thinkingLevel}
              dropdownPlacement="below"
              showEmptyModelControl
              unselectedModelLabel={modelOnboarding.unselectedModelLabel}
              emptyModelLabel={MODEL_OPTIONS_EMPTY_TITLE}
              emptyModelTitle={modelOnboarding.emptyModelTitle}
              emptyModelDescription={modelOnboarding.emptyModelDescription}
              onSetModel={onSetModel}
              onSetThinking={onSetThinking}
            />
          </div>

          <div className="composer__actions">
            <input
              ref={fileInputRef}
              hidden
              type="file"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) {
                  onAddAttachments(files);
                }
                event.currentTarget.value = "";
              }}
            />
            <button
              aria-label="Attach files"
              className="icon-button composer__attach"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <PlusIcon />
            </button>
            <button
              aria-label="Start thread"
              className="button button--primary button--cta-icon"
              type="button"
              disabled={!hasContent || modelOnboarding.requiresModelSelection}
              onClick={onSubmit}
            >
              <ArrowUpIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
