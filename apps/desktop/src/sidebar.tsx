import type { ReactNode } from "react";
import type { AppView, SessionRecord, WorkspaceRecord } from "./desktop-state";
import {
  ArchiveIcon,
  ChatIcon,
  ChevronDownIcon,
  ExtensionIcon,
  FeedbackIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  PlanIcon,
  PlusIcon,
  RestoreIcon,
  SettingsIcon,
  SkillIcon,
  WorktreeIcon,
} from "./icons";
import type { PiDesktopApi } from "./ipc";
import { formatRelativeTime } from "./string-utils";
import type { WorkspaceMenuState } from "./hooks/use-workspace-menu";
import type { ThreadGroup, ThreadListEntry } from "./thread-groups";

interface SidebarProps {
  readonly activeView: AppView;
  readonly activeWorkspace: WorkspaceRecord | undefined;
  readonly selectedWorkspace: WorkspaceRecord | undefined;
  readonly selectedSession: SessionRecord | undefined;
  readonly threadGroups: readonly ThreadGroup[];
  readonly wsMenu: WorkspaceMenuState;
  readonly api: PiDesktopApi;
  readonly onOpenHome: (workspaceId?: string) => void;
  readonly onOpenBacklog: (workspaceId?: string) => void;
  readonly onOpenWorktrees: (workspaceId?: string) => void;
  readonly onNewThread: (workspaceId?: string) => void;
  readonly onOpenSessions: (workspaceId?: string) => void;
  readonly onOpenPlans: (workspaceId?: string) => void;
  readonly onOpenProjectPreferences: (workspaceId?: string) => void;
  readonly onOpenSkills: (workspaceId?: string) => void;
  readonly onOpenExtensions: (workspaceId?: string) => void;
  readonly onOpenSettings: (workspaceId?: string) => void;
  readonly onArchiveSession: (target: { workspaceId: string; sessionId: string }) => void;
  readonly onSelectSession: (target: { workspaceId: string; sessionId: string }) => void;
  readonly onUnarchiveSession: (target: { workspaceId: string; sessionId: string }) => void;
}

export function Sidebar(props: SidebarProps) {
  const {
    activeView,
    activeWorkspace,
    selectedWorkspace,
    selectedSession,
    threadGroups,
    wsMenu,
    api,
    onOpenHome,
    onOpenBacklog,
    onOpenWorktrees,
    onNewThread,
    onOpenSessions,
    onOpenPlans,
    onOpenProjectPreferences,
    onOpenSkills,
    onOpenExtensions,
    onOpenSettings,
    onArchiveSession,
    onSelectSession,
    onUnarchiveSession,
  } = props;

  const activeGroup = activeWorkspace
    ? threadGroups.find((group) => group.rootWorkspace.id === activeWorkspace.id)
    : undefined;
  const archivedSectionOpen =
    activeWorkspace ? wsMenu.expandedArchivedByWorkspace[activeWorkspace.id] ?? false : false;

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        {activeWorkspace ? (
          <ProjectHeader workspace={activeWorkspace} wsMenu={wsMenu} api={api} />
        ) : (
          <div className="project-header project-header--empty">
            <span className="project-header__icon" aria-hidden="true">
              <FolderIcon />
            </span>
            <div className="project-header__copy">
              <strong>No Project</strong>
              <span>Open a project folder to begin.</span>
            </div>
          </div>
        )}

        <nav className="sidebar__nav" aria-label="Project pages">
          <WorkspacePageButton
            active={activeView === "home"}
            icon={<HomeIcon />}
            label="Project Overview"
            disabled={!activeWorkspace}
            onClick={() => onOpenHome(activeWorkspace?.id)}
          />
          <WorkspacePageButton
            active={activeView === "threads"}
            icon={<InboxIcon />}
            label="Threads"
            disabled={!activeWorkspace}
            onClick={() => onOpenSessions(activeWorkspace?.id)}
          />
          <WorkspacePageButton
            active={activeView === "plans"}
            icon={<PlanIcon />}
            label="Plans"
            disabled={!activeWorkspace}
            onClick={() => onOpenPlans(activeWorkspace?.id)}
          />
          <WorkspacePageButton
            active={activeView === "backlog"}
            icon={<FeedbackIcon />}
            label="Backlog"
            disabled={!activeWorkspace}
            onClick={() => onOpenBacklog(activeWorkspace?.id)}
          />
          <WorkspacePageButton
            active={activeView === "worktrees"}
            icon={<WorktreeIcon />}
            label="Worktrees"
            disabled={!activeWorkspace}
            onClick={() => onOpenWorktrees(activeWorkspace?.id)}
          />
          <WorkspacePageButton
            active={activeView === "skills"}
            icon={<SkillIcon />}
            label="Skills"
            disabled={!activeWorkspace}
            onClick={() => onOpenSkills(activeWorkspace?.id)}
          />
          <WorkspacePageButton
            active={activeView === "extensions"}
            icon={<ExtensionIcon />}
            label="Extensions"
            disabled={!activeWorkspace}
            onClick={() => onOpenExtensions(activeWorkspace?.id)}
          />
          <WorkspacePageButton
            active={activeView === "project-preferences"}
            icon={<SettingsIcon />}
            label="Project Preferences"
            disabled={!activeWorkspace}
            onClick={() => onOpenProjectPreferences(activeWorkspace?.id)}
          />
        </nav>
      </div>

      <div className="sidebar__section">
        <div className="section__head">
          <span>Recent Threads</span>
          <div className="section__tools">
            <button
              aria-label="Create Thread"
              className="icon-button"
              type="button"
              disabled={!activeWorkspace}
              onClick={() => onNewThread(activeWorkspace?.id)}
            >
              <PlusIcon />
            </button>
          </div>
        </div>
        <button
          className={`quick-chat-row ${activeView === "new-thread" ? "quick-chat-row--active" : ""}`}
          type="button"
          onClick={() => onNewThread(activeWorkspace?.id)}
          disabled={!activeWorkspace}
        >
          <ChatIcon />
          <span>New Thread</span>
        </button>

        {activeGroup ? (
          <>
            <div className="session-list">
              {activeGroup.threads.length > 0 ? (
                activeGroup.threads.map((thread) => {
                  const active = thread.workspaceId === selectedWorkspace?.id && thread.session.id === selectedSession?.id;
                  return (
                    <ThreadSessionRow
                      key={`${thread.workspaceId}:${thread.session.id}`}
                      active={active}
                      thread={thread}
                      onAction={() =>
                        onArchiveSession({
                          workspaceId: thread.workspaceId,
                          sessionId: thread.session.id,
                        })
                      }
                      onSelect={() => onSelectSession({ workspaceId: thread.workspaceId, sessionId: thread.session.id })}
                    />
                  );
                })
              ) : (
                <p className="sidebar-empty-copy">Start a thread to capture the next project decision.</p>
              )}
            </div>
            {activeGroup.archivedThreads.length > 0 ? (
              <div className="archived-thread-group">
                <button
                  aria-expanded={archivedSectionOpen}
                  className="archived-thread-group__toggle"
                  type="button"
                  onClick={() => wsMenu.toggleArchived(activeGroup.rootWorkspace.id, !archivedSectionOpen)}
                >
                  <span
                    aria-hidden="true"
                    className={`archived-thread-group__chevron ${archivedSectionOpen ? "archived-thread-group__chevron--open" : ""}`}
                  >
                    <ChevronDownIcon />
                  </span>
                  <span>Archived</span>
                  <span className="archived-thread-group__count">{activeGroup.archivedThreads.length}</span>
                </button>
                {archivedSectionOpen ? (
                  <div className="session-list session-list--archived">
                    {activeGroup.archivedThreads.map((thread) => {
                      const active =
                        thread.workspaceId === selectedWorkspace?.id && thread.session.id === selectedSession?.id;
                      return (
                        <ThreadSessionRow
                          key={`${thread.workspaceId}:${thread.session.id}`}
                          active={active}
                          archived
                          thread={thread}
                          onAction={() =>
                            onUnarchiveSession({
                              workspaceId: thread.workspaceId,
                              sessionId: thread.session.id,
                            })
                          }
                          onSelect={() => onSelectSession({ workspaceId: thread.workspaceId, sessionId: thread.session.id })}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : activeWorkspace ? (
          <p className="sidebar-empty-copy">Start a thread to capture the next project decision.</p>
        ) : (
          <p className="sidebar-empty-copy">Open a project to see its pages and threads.</p>
        )}
      </div>

      <div className="sidebar__footer">
        <button
          className={`sidebar__settings ${activeView === "settings" ? "sidebar__settings--active" : ""}`}
          type="button"
          onClick={() => onOpenSettings(activeWorkspace?.id)}
        >
          <span className="sidebar__settings-mark">
            <SettingsIcon />
          </span>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

function ProjectHeader({
  workspace,
  wsMenu,
  api,
}: {
  readonly workspace: WorkspaceRecord;
  readonly wsMenu: WorkspaceMenuState;
  readonly api: PiDesktopApi;
}) {
  return (
    <div className="project-header">
      <span className="project-header__icon" aria-hidden="true">
        <FolderIcon />
      </span>
      <div className="project-header__copy">
        <strong>{workspace.name}</strong>
        <span>Project</span>
      </div>
      <span
        className="workspace-row__menu-wrap"
        ref={wsMenu.workspaceMenuId === workspace.id ? wsMenu.workspaceMenuWrapRef : undefined}
      >
        <button
          aria-label={`Project actions for ${workspace.name}`}
          aria-haspopup="menu"
          className="icon-button workspace-row__menu-button"
          aria-expanded={wsMenu.workspaceMenuId === workspace.id}
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            wsMenu.openWorkspaceMenu(workspace.id);
          }}
        >
          …
        </button>
        {wsMenu.workspaceMenuId === workspace.id ? (
          <div className="workspace-menu">
            <button
              className="workspace-menu__item"
              type="button"
              onClick={(event) =>
                wsMenu.runWorkspaceMenuAction(event, () => {
                  void api.openWorkspaceInFinder(workspace.id);
                })
              }
            >
              Open Folder
            </button>
            {workspace.kind !== "worktree" ? (
              <button
                className="workspace-menu__item"
                type="button"
                onClick={(event) =>
                  wsMenu.runWorkspaceMenuAction(event, () => {
                    wsMenu.createWorktree(workspace.id);
                  })
                }
              >
                Create permanent worktree
              </button>
            ) : null}
            <button
              className="workspace-menu__item"
              type="button"
              onClick={(event) => wsMenu.runWorkspaceMenuAction(event, () => wsMenu.startRename(workspace))}
            >
              Rename Project
            </button>
            <button
              className="workspace-menu__item workspace-menu__item--danger"
              type="button"
              onClick={(event) => wsMenu.runWorkspaceMenuAction(event, () => wsMenu.removeWorkspace(workspace))}
            >
              Remove Project
            </button>
          </div>
        ) : null}
      </span>
      {wsMenu.workspaceRenameId === workspace.id ? (
        <form
          className="workspace-rename"
          ref={wsMenu.workspaceRenamePanelRef}
          onSubmit={(event) => {
            event.preventDefault();
            wsMenu.submitRename(workspace);
          }}
        >
          <input
            aria-label={`Rename Project ${workspace.name}`}
            className="workspace-rename__input"
            ref={wsMenu.workspaceRenameInputRef}
            value={wsMenu.workspaceRenameDraft}
            onChange={(event) => wsMenu.setWorkspaceRenameDraft(event.target.value)}
          />
          <div className="workspace-rename__actions">
            <button className="workspace-rename__button" type="button" onClick={wsMenu.cancelRename}>
              Cancel
            </button>
            <button className="workspace-rename__button workspace-rename__button--primary" type="submit">
              Save
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function WorkspacePageButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  readonly active: boolean;
  readonly disabled?: boolean;
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      className={`sidebar__nav-item ${active ? "sidebar__nav-item--active" : ""}`}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function sessionIndicatorVariant(thread: ThreadListEntry): "running" | "unseen" | "none" {
  if (thread.session.status === "running") {
    return "running";
  }
  if (thread.session.hasUnseenUpdate) {
    return "unseen";
  }
  return "none";
}

function ThreadSessionRow({
  active,
  archived = false,
  thread,
  onAction,
  onSelect,
}: {
  readonly active: boolean;
  readonly archived?: boolean;
  readonly thread: ThreadListEntry;
  readonly onAction: () => void;
  readonly onSelect: () => void;
}) {
  const indicatorVariant = sessionIndicatorVariant(thread);
  return (
    <div
      className={`session-row ${active ? "session-row--active" : ""}`}
      data-sidebar-indicator={indicatorVariant}
      data-session-id={thread.session.id}
    >
      <button className="session-row__select" onClick={onSelect} type="button">
        <span className="session-row__leading" aria-hidden="true">
          {indicatorVariant === "running" ? <span className="session-row__status session-row__status--running" /> : null}
          {indicatorVariant === "unseen" ? <span className="session-row__status session-row__status--unseen" /> : null}
        </span>
        <span className="session-row__body">
          <span className="session-row__title-line">
            <span className="session-row__title">{thread.session.title}</span>
          </span>
          {thread.session.preview ? <span className="session-row__preview">{thread.session.preview}</span> : null}
        </span>
      </button>
      <span className="session-row__trailing">
        {thread.environment.kind === "worktree" ? (
          <span className="session-row__workspace-icon" aria-hidden="true" title="Worktree">
            <WorktreeIcon />
          </span>
        ) : null}
        <span className="session-row__time">{formatRelativeTime(thread.session.updatedAt)}</span>
        <button
          aria-label={`${archived ? "Restore" : "Archive"} ${thread.session.title}`}
          className="icon-button session-row__action"
          type="button"
          onClick={onAction}
        >
          {archived ? <RestoreIcon /> : <ArchiveIcon />}
        </button>
      </span>
    </div>
  );
}
