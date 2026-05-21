import type { WorkspaceSessionTarget, WorkspaceRecord } from "./desktop-state";
import { ArchiveIcon, ChatIcon, PlusIcon, RestoreIcon } from "./icons";
import { formatRelativeTime } from "./string-utils";
import type { ThreadGroup, ThreadListEntry, ThreadPurpose } from "./thread-groups";

interface ProjectThreadsViewProps {
  readonly workspace: WorkspaceRecord | undefined;
  readonly threadGroup: ThreadGroup | undefined;
  readonly onArchiveThread: (target: WorkspaceSessionTarget) => void;
  readonly onNewThread: (workspaceId?: string) => void;
  readonly onOpenProject: () => void;
  readonly onOpenThread: (target: WorkspaceSessionTarget) => void;
  readonly onRestoreThread: (target: WorkspaceSessionTarget) => void;
}

export function ProjectThreadsView({
  workspace,
  threadGroup,
  onArchiveThread,
  onNewThread,
  onOpenProject,
  onOpenThread,
  onRestoreThread,
}: ProjectThreadsViewProps) {
  if (!workspace) {
    return (
      <section className="canvas canvas--empty" data-testid="empty-state">
        <div className="empty-panel">
          <div className="session-header__eyebrow">Threads</div>
          <h1>Open a Project to Start</h1>
          <p>Add a project folder before browsing threads.</p>
          <div className="empty-panel__actions">
            <button className="button button--primary" type="button" onClick={onOpenProject}>
              Open Project
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="canvas canvas--backlog" data-testid="project-threads-view">
      <div className="project-backlog">
        <header className="project-backlog__header">
          <div>
            <div className="view-header__eyebrow">Threads</div>
            <h1>{workspace.name}</h1>
            <p>Browse project conversations by attention, with purpose shown as metadata.</p>
          </div>
          <button className="button button--primary" type="button" onClick={() => onNewThread(workspace.id)}>
            <PlusIcon />
            New Thread
          </button>
        </header>

        <ThreadSection
          title="Active"
          empty="No threads need attention."
          threads={threadGroup?.activeThreads ?? []}
          onAction={onArchiveThread}
          onOpenThread={onOpenThread}
        />
        <ThreadSection
          title="Follow-ups"
          empty="No follow-up threads yet."
          threads={threadGroup?.followUpThreads ?? []}
          onAction={onArchiveThread}
          onOpenThread={onOpenThread}
        />
        <ThreadSection
          title="Recent"
          empty="No recent threads yet."
          threads={threadGroup?.recentThreads ?? []}
          onAction={onArchiveThread}
          onOpenThread={onOpenThread}
        />
        <ThreadSection
          title="Archived"
          archived
          empty="No archived threads."
          threads={threadGroup?.archivedThreads ?? []}
          onAction={onRestoreThread}
          onOpenThread={onOpenThread}
        />
      </div>
    </section>
  );
}

function ThreadSection({
  archived = false,
  empty,
  threads,
  title,
  onAction,
  onOpenThread,
}: {
  readonly archived?: boolean;
  readonly empty: string;
  readonly threads: readonly ThreadListEntry[];
  readonly title: string;
  readonly onAction: (target: WorkspaceSessionTarget) => void;
  readonly onOpenThread: (target: WorkspaceSessionTarget) => void;
}) {
  return (
    <section className="project-backlog__reviewed" data-testid={`project-threads-${title.toLowerCase()}`}>
      <h2>{title}</h2>
      {threads.length > 0 ? (
        <div className="project-backlog__list">
          {threads.map((thread) => (
            <ThreadCard
              archived={archived}
              key={`${thread.workspaceId}:${thread.session.id}`}
              thread={thread}
              onAction={onAction}
              onOpenThread={onOpenThread}
            />
          ))}
        </div>
      ) : (
        <p className="project-home__empty">{empty}</p>
      )}
    </section>
  );
}

function ThreadCard({
  archived,
  thread,
  onAction,
  onOpenThread,
}: {
  readonly archived: boolean;
  readonly thread: ThreadListEntry;
  readonly onAction: (target: WorkspaceSessionTarget) => void;
  readonly onOpenThread: (target: WorkspaceSessionTarget) => void;
}) {
  const target = { workspaceId: thread.workspaceId, sessionId: thread.session.id };
  return (
    <article className="project-backlog__card" data-testid="project-thread-item">
      <div className="project-backlog__card-main">
        <div className="project-backlog__source">
          {formatThreadPurpose(thread.purpose)} · {thread.environment.label}
        </div>
        <p>{thread.session.title}</p>
        <small>{thread.session.preview || formatRelativeTime(thread.session.updatedAt)}</small>
      </div>
      <div className="project-backlog__actions">
        <button className="button button--primary" type="button" onClick={() => onOpenThread(target)}>
          <ChatIcon />
          Open Thread
        </button>
        <button className="button button--ghost" type="button" onClick={() => onAction(target)}>
          {archived ? <RestoreIcon /> : <ArchiveIcon />}
          {archived ? "Restore" : "Archive"}
        </button>
      </div>
    </article>
  );
}

function formatThreadPurpose(purpose: ThreadPurpose): string {
  switch (purpose) {
    case "follow-up":
      return "Follow-up";
    case "plan":
      return "Plan";
    case "research":
      return "Research";
    case "execute":
      return "Execute";
    case "review":
      return "Review";
    case "general":
      return "General";
  }
}
