import type { WorkspaceRecord, WorktreeRecord } from "./desktop-state";
import { WorktreeIcon } from "./icons";
import { formatRelativeTime } from "./string-utils";

interface ProjectWorktreesViewProps {
  readonly workspace: WorkspaceRecord | undefined;
  readonly worktrees: readonly WorktreeRecord[];
  readonly onCreateWorktree: (workspaceId: string) => void;
  readonly onRemoveWorktree: (worktree: WorktreeRecord) => void;
}

export function ProjectWorktreesView({
  workspace,
  worktrees,
  onCreateWorktree,
  onRemoveWorktree,
}: ProjectWorktreesViewProps) {
  if (!workspace) {
    return (
      <section className="canvas canvas--empty" data-testid="empty-state">
        <div className="empty-panel">
          <div className="session-header__eyebrow">Worktrees</div>
          <h1>Open a Project First</h1>
          <p>Worktrees belong to a project.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="canvas canvas--backlog" data-testid="project-worktrees-view">
      <div className="project-backlog">
        <header className="project-backlog__header">
          <div>
            <div className="view-header__eyebrow">Project Worktrees</div>
            <h1>Execution environments</h1>
            <p>Keep isolated worktrees available for threads and slices that need separate working copies.</p>
          </div>
          <button className="button button--primary" type="button" onClick={() => onCreateWorktree(workspace.id)}>
            <WorktreeIcon />
            Create Worktree
          </button>
        </header>

        {worktrees.length > 0 ? (
          <div className="project-backlog__list">
            {worktrees.map((worktree) => (
              <article className="project-backlog__card" data-testid="project-worktree-item" key={worktree.id}>
                <div className="project-backlog__card-main">
                  <div className="project-backlog__source">{formatWorktreeStatus(worktree.status)}</div>
                  <p>{worktree.name}</p>
                  <small>
                    {worktree.branchName ? `${worktree.branchName} · ` : ""}
                    {formatRelativeTime(worktree.updatedAt)}
                  </small>
                  <small>{worktree.path}</small>
                </div>
                <div className="project-backlog__actions">
                  <button className="button button--ghost" type="button" onClick={() => onRemoveWorktree(worktree)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="project-backlog__empty">
            <h2>No linked worktrees yet</h2>
            <p>Create a worktree when a thread or slice needs an isolated working copy.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function formatWorktreeStatus(status: WorktreeRecord["status"]): string {
  if (status === "ready") {
    return "Ready";
  }
  if (status === "missing") {
    return "Missing";
  }
  return "Needs attention";
}
