import { useMemo, useState } from "react";
import type { RuntimeSkillRecord, RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import type { WorkspaceRecord } from "./desktop-state";
import { RefreshIcon, SkillIcon } from "./icons";
import { titleCase } from "./string-utils";

interface SkillsViewProps {
  readonly workspace?: WorkspaceRecord;
  readonly runtime?: RuntimeSnapshot;
  readonly onRefresh: () => void;
  readonly onOpenSkillFolder: (filePath: string) => void;
  readonly onToggleSkill: (filePath: string, enabled: boolean) => void;
  readonly onTrySkill: (skill: RuntimeSkillRecord) => void;
}

export function SkillsView({
  workspace,
  runtime,
  onRefresh,
  onOpenSkillFolder,
  onToggleSkill,
  onTrySkill,
}: SkillsViewProps) {
  const [query, setQuery] = useState("");
  const [selectedSkillPath, setSelectedSkillPath] = useState<string | undefined>();
  const skills = runtime?.skills ?? [];
  const filteredSkills = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return skills;
    }

    return skills.filter((skill) =>
      [skill.name, skill.description, skill.source, skill.slashCommand].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query, skills]);
  const selectedSkill =
    filteredSkills.find((skill) => skill.filePath === selectedSkillPath) ?? filteredSkills[0];
  const enabledSkills = skills.filter((skill) => skill.enabled).length;
  const projectSkills = skills.filter((skill) => skill.source === "project").length;

  if (!workspace) {
    return (
      <section className="canvas canvas--empty">
        <div className="empty-panel">
          <div className="session-header__eyebrow">Skills</div>
          <h1>Select a workspace</h1>
          <p>Skills are discovered from the selected workspace plus your user-level skill directories.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="canvas">
      <div className="conversation skills-view">
        <header className="view-header catalog-header">
          <div className="catalog-header__main">
            <span className="catalog-header__icon" aria-hidden="true">
              <SkillIcon />
            </span>
            <div>
              <div className="chat-header__eyebrow">Skills</div>
              <h1 className="view-header__title">Workspace skills</h1>
              <p className="view-header__body">
                Choose the reusable prompts and workflow moves GSD can bring into this project.
              </p>
            </div>
          </div>
          <div className="catalog-header__side">
            <div className="catalog-stats" aria-label="Skills summary">
              <CatalogStat label="Available" value={skills.length} />
              <CatalogStat label="Enabled" value={enabledSkills} />
              <CatalogStat label="Project" value={projectSkills} />
            </div>
            <div className="view-header__actions">
              <button className="button button--secondary" type="button" onClick={onRefresh}>
                <RefreshIcon />
                <span>Refresh</span>
              </button>
              <button
                className="button button--primary"
                type="button"
                onClick={() =>
                  onTrySkill({
                    name: "new-skill",
                    description: "Create a new skill for this workspace",
                    filePath: "",
                    baseDir: workspace.path,
                    source: "project",
                    enabled: true,
                    disableModelInvocation: false,
                    slashCommand: "/skill:new-skill",
                  })
                }
              >
                New skill
              </button>
            </div>
          </div>
        </header>

        <div className="skills-toolbar">
          <input
            aria-label="Search skills"
            className="skills-search"
            placeholder="Search skills"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
          <span className="skills-toolbar__summary">
            {filteredSkills.length} shown · {enabledSkills} enabled
          </span>
        </div>

        <div className="skills-layout">
          <div className="skills-grid" data-testid="skills-list">
            {filteredSkills.length === 0 ? (
              <SkillsEmptyState message="Refresh discovery or create a new skill for this workspace." />
            ) : (
              filteredSkills.map((skill) => (
                <button
                  className={`skill-card ${selectedSkill?.filePath === skill.filePath ? "skill-card--active" : ""}`}
                  key={skill.filePath}
                  type="button"
                  onClick={() => {
                    setSelectedSkillPath(skill.filePath);
                  }}
                >
                  <span className="skill-card__top">
                    <span className="skill-card__icon" aria-hidden="true">
                      <SkillIcon />
                    </span>
                    <span className="skill-card__title-row">
                      <span className="skill-card__title">{titleCase(skill.name)}</span>
                      <span className={`skill-card__badge ${skill.enabled ? "skill-card__badge--enabled" : ""}`}>
                        {skill.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </span>
                  </span>
                  <span className="skill-card__description">{skill.description}</span>
                  <span className="skill-card__meta">
                    <span>{skill.source}</span>
                    <span>{skill.slashCommand}</span>
                    {skill.disableModelInvocation ? <span>slash only</span> : null}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="skill-detail">
            {selectedSkill ? (
              <>
                <div className="skill-detail__header">
                  <span className="skill-detail__icon" aria-hidden="true">
                    <SkillIcon />
                  </span>
                  <div>
                    <h2>{titleCase(selectedSkill.name)}</h2>
                    <div className="skill-detail__slash">{selectedSkill.slashCommand}</div>
                  </div>
                  <span className={`skill-detail__status ${selectedSkill.enabled ? "skill-detail__status--enabled" : ""}`}>
                    {selectedSkill.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="skill-detail__description">{selectedSkill.description}</p>
                <div className="skill-detail__summary-grid">
                  <DetailMetric label="Source" value={selectedSkill.source} />
                  <DetailMetric
                    label="Mode"
                    value={selectedSkill.disableModelInvocation ? "Slash only" : "Guided prompt"}
                  />
                  <DetailMetric label="Status" value={selectedSkill.enabled ? "Ready" : "Paused"} />
                </div>
                <div className="skill-detail__section">
                  <div className="skill-detail__meta-label">Location</div>
                  <div className="skill-detail__path">{selectedSkill.filePath}</div>
                </div>
                <div className="skill-detail__actions">
                  <button className="button button--secondary" type="button" onClick={() => onOpenSkillFolder(selectedSkill.filePath)}>
                    Open folder
                  </button>
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => onToggleSkill(selectedSkill.filePath, !selectedSkill.enabled)}
                  >
                    {selectedSkill.enabled ? "Disable" : "Enable"}
                  </button>
                  <button className="button button--primary" type="button" onClick={() => onTrySkill(selectedSkill)}>
                    Try
                  </button>
                </div>
              </>
            ) : (
              <SkillsEmptyState message="Refresh runtime discovery to load workspace and user-level skills." />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CatalogStat({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="catalog-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function DetailMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="skill-detail__metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SkillsEmptyState({ message }: { readonly message: string }) {
  return (
    <div className="empty-state">
      <h2>No skills found</h2>
      <p>{message}</p>
    </div>
  );
}
