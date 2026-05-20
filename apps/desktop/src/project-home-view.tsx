import type { ReactNode } from "react";
import type { RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import type { GlobalPlanningPreferences, WorkspacePlanningState, WorkspaceRecord, WorktreeRecord } from "./desktop-state";
import { BranchIcon, ChatIcon, FolderIcon, PlanIcon, SettingsIcon } from "./icons";
import { formatRelativeTime } from "./string-utils";
import type { ThreadGroup, ThreadListEntry } from "./thread-groups";

interface ProjectHomeViewProps {
  readonly workspace: WorkspaceRecord | undefined;
  readonly threadGroup: ThreadGroup | undefined;
  readonly planningState: WorkspacePlanningState | undefined;
  readonly runtime: RuntimeSnapshot | undefined;
  readonly worktrees: readonly WorktreeRecord[];
  readonly globalPlanningPreferences: GlobalPlanningPreferences;
  readonly onOpenPlans: (workspaceId?: string) => void;
  readonly onOpenProjectPreferences: (workspaceId?: string) => void;
  readonly onOpenNewThread: (workspaceId?: string) => void;
  readonly onOpenThread: (target: { workspaceId: string; sessionId: string }) => void;
  readonly onOpenProject: () => void;
}

export function ProjectHomeView({
  workspace,
  threadGroup,
  planningState,
  runtime,
  worktrees,
  globalPlanningPreferences,
  onOpenPlans,
  onOpenProjectPreferences,
  onOpenNewThread,
  onOpenThread,
  onOpenProject,
}: ProjectHomeViewProps) {
  if (!workspace) {
    return (
      <section className="canvas canvas--empty" data-testid="empty-state">
        <div className="empty-panel">
          <div className="session-header__eyebrow">Project Home</div>
          <h1>Open a Project to Start</h1>
          <p>Add a project folder to see plans, threads, and project health in one place.</p>
          <div className="empty-panel__actions">
            <button className="button button--primary" type="button" onClick={onOpenProject}>
              Open Project
            </button>
          </div>
        </div>
      </section>
    );
  }

  const activePlans = planningState?.plans.filter((plan) => plan.status !== "archived") ?? [];
  const selectedPlan = planningState?.selectedPlan;
  const selectedDashboardRow =
    selectedPlan
      ? planningState?.planDashboardRows.find((row) => row.planId === selectedPlan.id)
      : planningState?.planDashboardRows[0];
  const planName = selectedPlan?.name ?? selectedDashboardRow?.name ?? activePlans[0]?.name;
  const nextWork = selectedDashboardRow?.nextWork || "Open the plan to choose the next step.";
  const latestThreads = threadGroup?.threads.slice(0, 3) ?? [];
  const runningThreads = threadGroup?.threads.filter((thread) => thread.session.status === "running").length ?? 0;
  const issueCount = (planningState?.planDashboardRows ?? []).reduce(
    (total, row) =>
      total +
      row.blockerCount +
      row.recoveryStopCount +
      row.evidenceGapCount +
      row.projectionIssueCount +
      row.crossPlanConflictCount,
    0,
  );
  const preferenceStatus = describePreferenceStatus(planningState, runtime, globalPlanningPreferences);

  return (
    <section className="canvas canvas--project-home" data-testid="project-home-view">
      <div className="project-home">
        <header className="project-home__header">
          <div>
            <div className="view-header__eyebrow">Project Home</div>
            <h1>{workspace.name}</h1>
            <p>{workspace.path}</p>
          </div>
          <button className="button button--ghost" type="button" onClick={() => onOpenProjectPreferences(workspace.id)}>
            Project Preferences
          </button>
        </header>

        <section className="project-home__hero-card">
          <div className="project-home__hero-icon">
            <PlanIcon />
          </div>
          <div className="project-home__hero-copy">
            <span>{planName ? "Continue the plan" : "Create a plan"}</span>
            <h2>{planName ?? "Turn this project into a guided GSD plan."}</h2>
            <p>{planName ? nextWork : "Capture the outcome, constraints, milestones, phases, slices, and tasks before execution starts."}</p>
            {selectedDashboardRow ? (
              <div className="project-home__phase-strip">
                <span>{selectedDashboardRow.activePhase}</span>
                <span>{selectedDashboardRow.activeStage}</span>
                <span>{selectedDashboardRow.readyCount} ready</span>
                <span>{selectedDashboardRow.blockedCount} blocked</span>
              </div>
            ) : null}
          </div>
          <div className="project-home__hero-actions">
            <button className="button button--primary" type="button" onClick={() => onOpenPlans(workspace.id)}>
              {planName ? "Open Plan" : "Create Plan"}
            </button>
            <button className="button button--ghost" type="button" onClick={() => onOpenNewThread(workspace.id)}>
              Start Thread
            </button>
          </div>
        </section>

        <div className="project-home__grid">
          <section className="project-home__panel">
            <div className="project-home__panel-head">
              <h2>Recent Threads</h2>
              <button className="text-button" type="button" onClick={() => onOpenNewThread(workspace.id)}>
                New Thread
              </button>
            </div>
            {latestThreads.length > 0 ? (
              <div className="project-home__thread-list">
                {latestThreads.map((thread) => (
                  <button
                    className="project-home__thread"
                    key={`${thread.workspaceId}:${thread.session.id}`}
                    type="button"
                    onClick={() => onOpenThread({ workspaceId: thread.workspaceId, sessionId: thread.session.id })}
                  >
                    <span className="project-home__thread-icon">
                      <ChatIcon />
                    </span>
                    <span>
                      <strong>{thread.session.title}</strong>
                      <small>{thread.session.preview || thread.environment.label}</small>
                    </span>
                    <time>{formatRelativeTime(thread.session.updatedAt)}</time>
                  </button>
                ))}
              </div>
            ) : (
              <p className="project-home__empty">Start a thread to capture decisions and implementation notes.</p>
            )}
          </section>

          <section className="project-home__panel">
            <div className="project-home__panel-head">
              <h2>Project Health</h2>
              <button className="text-button" type="button" onClick={() => onOpenProjectPreferences(workspace.id)}>
                Preferences
              </button>
            </div>
            <div className="project-home__signal-list">
              <HealthSignal icon={<PlanIcon />} label="Plans" value={formatPlanSignal(activePlans.length, issueCount)} />
              <HealthSignal icon={<ChatIcon />} label="Threads" value={formatThreadSignal(threadGroup?.threads.length ?? 0, runningThreads)} />
              <HealthSignal icon={<BranchIcon />} label="Worktrees" value={formatWorktreeSignal(worktrees)} />
              <HealthSignal icon={<SettingsIcon />} label="Models" value={preferenceStatus} />
              <HealthSignal icon={<FolderIcon />} label="Project" value={workspace.branchName ?? "Local workspace"} />
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function HealthSignal({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="project-home__signal">
      <span>{icon}</span>
      <div>
        <strong>{label}</strong>
        <small>{value}</small>
      </div>
    </div>
  );
}

function formatPlanSignal(planCount: number, issueCount: number): string {
  if (planCount === 0) {
    return "No plan yet";
  }
  if (issueCount === 0) {
    return `${planCount} active, no health flags`;
  }
  return `${planCount} active, ${issueCount} needs attention`;
}

function formatThreadSignal(threadCount: number, runningThreads: number): string {
  if (threadCount === 0) {
    return "No threads yet";
  }
  if (runningThreads === 0) {
    return `${threadCount} recent`;
  }
  return `${threadCount} recent, ${runningThreads} running`;
}

function formatWorktreeSignal(worktrees: readonly WorktreeRecord[]): string {
  if (worktrees.length === 0) {
    return "Local only";
  }
  const readyCount = worktrees.filter((worktree) => worktree.status === "ready").length;
  return `${readyCount}/${worktrees.length} ready`;
}

function describePreferenceStatus(
  planningState: WorkspacePlanningState | undefined,
  runtime: RuntimeSnapshot | undefined,
  globalPlanningPreferences: GlobalPlanningPreferences,
): string {
  const planPhaseModels = planningState?.selectedPlan?.workflowPreferences?.models.phaseOverrides ?? {};
  if (Object.keys(planPhaseModels).length > 0) {
    return "Custom phase models";
  }
  if (Object.keys(globalPlanningPreferences.phaseModels).length > 0) {
    return "Using team phase defaults";
  }
  if (runtime?.settings.defaultProvider && runtime.settings.defaultModelId) {
    return `${runtime.settings.defaultProvider}/${runtime.settings.defaultModelId}`;
  }
  return "Using thread default";
}
