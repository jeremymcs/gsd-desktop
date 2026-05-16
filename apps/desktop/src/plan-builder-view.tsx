import type { WorkspaceRecord } from "./desktop-state";
import { ArrowUpIcon, PlanIcon } from "./icons";

const planPhases = ["DISCUSS", "RESEARCH", "PLAN", "EXECUTE", "VERIFY", "SHIP"] as const;

const outlineStats = [
  { label: "Milestones", value: "0" },
  { label: "Phases", value: "0" },
  { label: "Slices", value: "0" },
  { label: "Tasks", value: "0" },
] as const;

interface PlanBuilderViewProps {
  readonly workspaces: readonly WorkspaceRecord[];
  readonly selectedWorkspaceId: string;
  readonly onSelectWorkspace: (workspaceId: string) => void;
}

export function PlanBuilderView({
  workspaces,
  selectedWorkspaceId,
  onSelectWorkspace,
}: PlanBuilderViewProps) {
  const workspace = workspaces.find((entry) => entry.id === selectedWorkspaceId) ?? workspaces[0];

  if (!workspace) {
    return (
      <section className="canvas canvas--empty">
        <div className="empty-panel">
          <div className="session-header__eyebrow">Plans</div>
          <h1>Open a folder to plan</h1>
          <p>Add a project folder before starting the planning workflow.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="canvas canvas--plans" data-testid="plan-builder-view">
      <div className="plan-workbench">
        <div className="plan-workbench__pane plan-workbench__pane--primary plan-workbench__pane--active">
          <header className="plan-pane__header">
            <div className="plan-pane__crumbs">
              <span className="plan-pane__chip">P1</span>
              <span>{workspace.name}</span>
              <span className="plan-pane__separator">/</span>
              <strong>Plan Builder</strong>
            </div>
            <div className="plan-pane__actions">
              <span className="plan-pane__icon-button" aria-hidden="true">
                <PlanIcon />
              </span>
            </div>
          </header>

          <div className="plan-builder__body">
            <div className="plan-builder__mark">
              <PlanIcon />
            </div>
            <div className="plan-builder__copy">
              <div className="plan-builder__eyebrow">Project planning</div>
              <h1 data-testid="plan-builder-title">Build a plan for {workspace.name}</h1>
              <p>
                Turn the project discussion into milestones, phases, slices, and tasks before execution starts.
              </p>
            </div>

            <div className="plan-phase-strip" aria-label="Planning workflow">
              {planPhases.map((phase, index) => (
                <div
                  className={`plan-phase ${index === 0 ? "plan-phase--active" : ""}`}
                  key={phase}
                >
                  <span className="plan-phase__index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="plan-phase__label">{phase}</span>
                  <span className="plan-phase__status">{index === 0 ? "Ready" : "Queued"}</span>
                </div>
              ))}
            </div>
          </div>

          <footer className="plan-composer" aria-label="Plan prompt composer">
            <div className="plan-composer__field">
              <span>Start with the project outcome, constraints, and users</span>
            </div>
            <button className="plan-composer__send" type="button" disabled aria-label="Start planning">
              <ArrowUpIcon />
            </button>
          </footer>
        </div>

        <aside className="plan-workbench__pane plan-workbench__pane--side">
          <header className="plan-pane__header">
            <div className="plan-pane__crumbs">
              <span className="plan-pane__chip">P2</span>
              <span>{workspace.name}</span>
              <span className="plan-pane__separator">/</span>
              <strong>Outline</strong>
            </div>
          </header>

          <div className="plan-side">
            <label className="plan-side__workspace">
              <span>Workspace</span>
              <select value={workspace.id} onChange={(event) => onSelectWorkspace(event.target.value)}>
                {workspaces.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="plan-outline-card">
              <div className="plan-outline-card__title">No plan selected</div>
              <div className="plan-outline-card__meta">DISCUSS is ready to start</div>
            </div>

            <div className="plan-outline-grid">
              {outlineStats.map((stat) => (
                <div className="plan-outline-stat" key={stat.label}>
                  <span>{stat.value}</span>
                  <small>{stat.label}</small>
                </div>
              ))}
            </div>

            <div className="plan-stage-list" aria-label="Plan structure">
              <div className="plan-stage-list__item plan-stage-list__item--active">
                <span>DISCUSS</span>
                <small>Questions</small>
              </div>
              <div className="plan-stage-list__item">
                <span>Milestones</span>
                <small>Waiting</small>
              </div>
              <div className="plan-stage-list__item">
                <span>Slices</span>
                <small>Waiting</small>
              </div>
              <div className="plan-stage-list__item">
                <span>Tasks</span>
                <small>Waiting</small>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
