import type { ProjectBacklogItem, WorkspaceRecord } from "./desktop-state";
import { ChatIcon, PlanIcon } from "./icons";
import { formatRelativeTime } from "./string-utils";

interface ProjectBacklogViewProps {
  readonly workspace: WorkspaceRecord | undefined;
  readonly items: readonly ProjectBacklogItem[];
  readonly onStartThread: (item: ProjectBacklogItem) => void;
  readonly onPromoteToPlan: (item: ProjectBacklogItem) => void;
  readonly onDismiss: (item: ProjectBacklogItem) => void;
  readonly onOpenPlans: (workspaceId?: string) => void;
}

export function ProjectBacklogView({
  workspace,
  items,
  onStartThread,
  onPromoteToPlan,
  onDismiss,
  onOpenPlans,
}: ProjectBacklogViewProps) {
  if (!workspace) {
    return (
      <section className="canvas canvas--empty" data-testid="empty-state">
        <div className="empty-panel">
          <div className="session-header__eyebrow">Backlog</div>
          <h1>Open a Project to Start</h1>
          <p>Saved follow-ups belong to a project.</p>
        </div>
      </section>
    );
  }

  const visibleItems = items.filter((item) => item.status !== "removed");
  const openItems = visibleItems.filter((item) => item.status === "open");
  const reviewedItems = visibleItems.filter((item) => item.status !== "open");

  return (
    <section className="canvas canvas--backlog" data-testid="project-backlog-view">
      <div className="project-backlog">
        <header className="project-backlog__header">
          <div>
            <div className="view-header__eyebrow">Project Backlog</div>
            <h1>Saved follow-ups</h1>
            <p>Keep useful ideas from threads here until they become a thread, plan item, or dismissed note.</p>
          </div>
          <button className="button button--ghost" type="button" onClick={() => onOpenPlans(workspace.id)}>
            Open Plans
          </button>
        </header>

        {openItems.length > 0 ? (
          <div className="project-backlog__list">
            {openItems.map((item) => (
              <BacklogCard
                item={item}
                key={item.id}
                onDismiss={onDismiss}
                onPromoteToPlan={onPromoteToPlan}
                onStartThread={onStartThread}
              />
            ))}
          </div>
        ) : (
          <div className="project-backlog__empty">
            <h2>No saved follow-ups yet</h2>
            <p>Highlight useful text in a thread, then choose Save for later.</p>
          </div>
        )}

        {reviewedItems.length > 0 ? (
          <section className="project-backlog__reviewed">
            <h2>Reviewed</h2>
            {reviewedItems.map((item) => (
              <article className="project-backlog__reviewed-item" key={item.id}>
                <span>{formatReviewedStatus(item.status)}</span>
                <p>{item.text}</p>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </section>
  );
}

function formatReviewedStatus(status: ProjectBacklogItem["status"]): string {
  if (status === "started") {
    return "Thread started";
  }
  if (status === "promoted") {
    return "Promoted";
  }
  return "Dismissed";
}

function BacklogCard({
  item,
  onDismiss,
  onPromoteToPlan,
  onStartThread,
}: {
  readonly item: ProjectBacklogItem;
  readonly onDismiss: (item: ProjectBacklogItem) => void;
  readonly onPromoteToPlan: (item: ProjectBacklogItem) => void;
  readonly onStartThread: (item: ProjectBacklogItem) => void;
}) {
  return (
    <article className="project-backlog__card" data-testid="project-backlog-item">
      <div className="project-backlog__card-main">
        <div className="project-backlog__source">{item.source.label}</div>
        <p>{item.text}</p>
        <small>{formatRelativeTime(item.createdAt)}</small>
      </div>
      <div className="project-backlog__actions">
        <button className="button button--primary" type="button" onClick={() => onStartThread(item)}>
          <ChatIcon />
          Start Thread
        </button>
        <button className="button button--ghost" type="button" onClick={() => onPromoteToPlan(item)}>
          <PlanIcon />
          Promote to Plan
        </button>
        <button className="button button--ghost" type="button" onClick={() => onDismiss(item)}>
          Dismiss
        </button>
      </div>
    </article>
  );
}
