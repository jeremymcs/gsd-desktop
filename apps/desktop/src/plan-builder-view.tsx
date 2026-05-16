import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AnswerRecord } from "@pi-gui/gsd-planning";
import type {
  ConfirmPlanningStageInput,
  CreatePlanningPlanInput,
  DesktopAppState,
  RecordPlanningAnswerInput,
  RevisePlanningAnswerInput,
  SelectPlanningPlanInput,
  WorkspacePlanningState,
  WorkspaceRecord,
} from "./desktop-state";
import { ArrowUpIcon, PlanIcon } from "./icons";
import {
  buildProjectPatch,
  discussStageOrder,
  getActiveDiscussQuestion,
  getDiscussQuestion,
  getDiscussQuestionsForStage,
  getDiscussStageProgress,
  getLatestAnswersByQuestion,
  getLatestDiscussAnswers,
  isDiscussStage,
  type DiscussStage,
} from "./plan-builder-discuss";

const planPhases = [
  { id: "discuss", label: "DISCUSS" },
  { id: "research", label: "RESEARCH" },
  { id: "plan", label: "PLAN" },
  { id: "execute", label: "EXECUTE" },
  { id: "verify", label: "VERIFY" },
  { id: "ship", label: "SHIP" },
] as const;

interface PlanBuilderViewProps {
  readonly workspaces: readonly WorkspaceRecord[];
  readonly selectedWorkspaceId: string;
  readonly planningState: WorkspacePlanningState | undefined;
  readonly lastError?: string;
  readonly onSelectWorkspace: (workspaceId: string) => void;
  readonly onCreatePlan: (input: CreatePlanningPlanInput) => Promise<DesktopAppState>;
  readonly onSelectPlan: (input: SelectPlanningPlanInput) => Promise<DesktopAppState>;
  readonly onRecordAnswer: (input: RecordPlanningAnswerInput) => Promise<DesktopAppState>;
  readonly onReviseAnswer: (input: RevisePlanningAnswerInput) => Promise<DesktopAppState>;
  readonly onConfirmStage: (input: ConfirmPlanningStageInput) => Promise<DesktopAppState>;
}

export function PlanBuilderView({
  workspaces,
  selectedWorkspaceId,
  planningState,
  lastError,
  onSelectWorkspace,
  onCreatePlan,
  onSelectPlan,
  onRecordAnswer,
  onReviseAnswer,
  onConfirmStage,
}: PlanBuilderViewProps) {
  const workspace = workspaces.find((entry) => entry.id === selectedWorkspaceId) ?? workspaces[0];
  const [planName, setPlanName] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");
  const [editingAnswerId, setEditingAnswerId] = useState("");
  const [revisionDraft, setRevisionDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const snapshot = planningState?.selectedPlan;
  const activeQuestion = getActiveDiscussQuestion(snapshot);
  const activeStage: DiscussStage = snapshot && isDiscussStage(snapshot.activeStage) ? snapshot.activeStage : "project";
  const stageProgress = useMemo(
    () => discussStageOrder.map((stage) => getDiscussStageProgress(snapshot, stage)),
    [snapshot],
  );
  const latestAnswers = useMemo(() => getLatestDiscussAnswers(snapshot), [snapshot]);
  const latestAnswersByQuestion = useMemo(() => getLatestAnswersByQuestion(snapshot), [snapshot]);
  const currentProgress = stageProgress.find((progress) => progress.stage === activeStage) ?? stageProgress[0];
  const allDiscussConfirmed = stageProgress.every((progress) => progress.depthConfirmed);

  useEffect(() => {
    const existingAnswer = activeQuestion ? latestAnswersByQuestion.get(activeQuestion.id)?.answer : "";
    setAnswerDraft(existingAnswer ?? "");
  }, [activeQuestion?.id, latestAnswersByQuestion, snapshot?.id]);

  useEffect(() => {
    setEditingAnswerId("");
    setRevisionDraft("");
  }, [snapshot?.id]);

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

  const handleCreatePlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = planName.trim();
    if (!name || submitting) {
      return;
    }
    setSubmitting(true);
    void onCreatePlan({ workspaceId: workspace.id, name })
      .then(() => {
        setPlanName("");
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const recordAnswer = (loadBearing: boolean) => {
    if (!snapshot || !activeQuestion || submitting) {
      return;
    }
    const answer = answerDraft.trim();
    if (!answer) {
      return;
    }
    setSubmitting(true);
    void onRecordAnswer({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      stage: activeQuestion.stage,
      questionId: activeQuestion.id,
      prompt: activeQuestion.prompt,
      answer,
      loadBearing,
      ...(loadBearing ? {} : { discretionRationale: "Parked for later review" }),
      ...(loadBearing ? { projectPatch: buildProjectPatch(activeQuestion.id, answer) } : {}),
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const confirmStage = () => {
    if (!snapshot || !currentProgress || submitting) {
      return;
    }
    setSubmitting(true);
    void onConfirmStage({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      stage: currentProgress.stage,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const saveRevision = (answer: AnswerRecord) => {
    if (!snapshot || submitting) {
      return;
    }
    const revised = revisionDraft.trim();
    if (!revised) {
      return;
    }
    setSubmitting(true);
    void onReviseAnswer({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      answerId: answer.id,
      answer: revised,
      rationale: "User revision",
      projectPatch: buildProjectPatch(answer.questionId, revised),
    })
      .then(() => {
        setEditingAnswerId("");
        setRevisionDraft("");
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const answerCount = latestAnswers.filter((answer) => answer.loadBearing).length;
  const parkedCount = latestAnswers.filter((answer) => !answer.loadBearing).length;
  const confirmedCount = stageProgress.filter((progress) => progress.depthConfirmed).length;
  const outlineStats = [
    { label: "Answers", value: String(answerCount) },
    { label: "Depth gates", value: `${confirmedCount}/3` },
    { label: "Parked", value: String(parkedCount) },
    { label: "Revision", value: String(snapshot?.revision ?? 0) },
  ] as const;

  return (
    <section className="canvas canvas--plans" data-testid="plan-builder-view">
      <div className="plan-workbench">
        <div className="plan-workbench__pane plan-workbench__pane--primary plan-workbench__pane--active">
          <header className="plan-pane__header">
            <div className="plan-pane__crumbs">
              <span className="plan-pane__chip">P1</span>
              <span>{workspace.name}</span>
              <span className="plan-pane__separator">/</span>
              <strong>{snapshot?.name ?? "Plan Builder"}</strong>
            </div>
            <div className="plan-pane__actions">
              <span className="plan-pane__icon-button" aria-hidden="true">
                <PlanIcon />
              </span>
            </div>
          </header>

          <div className={`plan-builder__body ${snapshot ? "plan-builder__body--wizard" : ""}`}>
            <div className="plan-builder__mark">
              <PlanIcon />
            </div>
            <div className="plan-builder__copy">
              <div className="plan-builder__eyebrow">Project planning</div>
              <h1 data-testid="plan-builder-title">Build a plan for {workspace.name}</h1>
              <p>
                {snapshot
                  ? "DISCUSS captures the load-bearing context before research and execution."
                  : "Turn the project discussion into milestones, phases, slices, and tasks before execution starts."}
              </p>
            </div>

            <div className="plan-phase-strip" aria-label="Planning workflow">
              {planPhases.map((phase, index) => (
                <div
                  className={`plan-phase ${snapshot?.activePhase === phase.id || (!snapshot && index === 0) ? "plan-phase--active" : ""}`}
                  key={phase.id}
                >
                  <span className="plan-phase__index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="plan-phase__label">{phase.label}</span>
                  <span className="plan-phase__status">
                    {snapshot?.activePhase === phase.id || (!snapshot && index === 0) ? "Active" : "Queued"}
                  </span>
                </div>
              ))}
            </div>

            {!snapshot ? (
              <form className="plan-create" onSubmit={handleCreatePlan}>
                <label className="plan-create__field">
                  <span>Plan name</span>
                  <input
                    autoComplete="off"
                    data-testid="plan-name-input"
                    onChange={(event) => setPlanName(event.target.value)}
                    placeholder="Launch plan"
                    value={planName}
                  />
                </label>
                <button className="plan-action-button" disabled={!planName.trim() || submitting} type="submit">
                  Create plan
                </button>
                {lastError ? <div className="plan-error">{lastError}</div> : null}
              </form>
            ) : allDiscussConfirmed ? (
              <div className="plan-depth-card plan-depth-card--complete" data-testid="plan-discuss-complete">
                <div className="plan-depth-card__eyebrow">DISCUSS complete</div>
                <h2>Ready for RESEARCH</h2>
                <p>The project, requirements, and milestone depth gates are confirmed.</p>
              </div>
            ) : activeQuestion ? (
              <div className="plan-question-card" data-testid="plan-question-card">
                <div className="plan-question-card__meta">
                  <span>{stageLabel(activeQuestion.stage)}</span>
                  <span>
                    {Math.min((currentProgress?.answered ?? 0) + 1, currentProgress?.total ?? 1)} of {currentProgress?.total ?? 1}
                  </span>
                </div>
                <h2 data-testid="plan-question-prompt">{activeQuestion.prompt}</h2>
                <p>{activeQuestion.helper}</p>
                <textarea
                  data-testid="plan-answer-textarea"
                  onChange={(event) => setAnswerDraft(event.target.value)}
                  placeholder="Answer with the context future planning decisions should remember."
                  value={answerDraft}
                />
                <div className="plan-question-card__actions">
                  <button
                    className="plan-action-button"
                    disabled={!answerDraft.trim() || submitting}
                    onClick={() => recordAnswer(true)}
                    type="button"
                  >
                    Save answer
                  </button>
                  <button
                    className="plan-secondary-button"
                    disabled={!answerDraft.trim() || submitting}
                    onClick={() => recordAnswer(false)}
                    type="button"
                  >
                    Park
                  </button>
                </div>
              </div>
            ) : currentProgress?.readyForReview && !currentProgress.depthConfirmed ? (
              <div className="plan-depth-card" data-testid="plan-depth-gate">
                <div className="plan-depth-card__eyebrow">{stageLabel(currentProgress.stage)} depth gate</div>
                <h2>Confirm this stage is deep enough</h2>
                <p>
                  {currentProgress.answered} of {currentProgress.total} load-bearing answers are captured.
                </p>
                <button className="plan-action-button" disabled={submitting} onClick={confirmStage} type="button">
                  Confirm {stageLabel(currentProgress.stage)}
                </button>
              </div>
            ) : null}
          </div>

          <footer className="plan-composer" aria-label="Plan prompt composer">
            <div className="plan-composer__field">
              <span>
                {activeQuestion
                  ? activeQuestion.prompt
                  : snapshot
                    ? "DISCUSS memory is persisted in the planning database"
                    : "Start with the project outcome, constraints, and users"}
              </span>
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

            {planningState?.plans.length ? (
              <label className="plan-side__workspace">
                <span>Plan</span>
                <select
                  data-testid="plan-select"
                  value={planningState.selectedPlanId}
                  onChange={(event) => {
                    if (event.target.value) {
                      void onSelectPlan({ workspaceId: workspace.id, planId: event.target.value });
                    }
                  }}
                >
                  {planningState.plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.readableId} · {plan.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="plan-outline-card">
              <div className="plan-outline-card__title" data-testid="plan-outline-title">
                {snapshot?.name ?? "No plan selected"}
              </div>
              <div className="plan-outline-card__meta">
                {snapshot ? `${snapshot.readableId} · ${stageLabel(activeStage)}` : "DISCUSS is ready to start"}
              </div>
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
              {stageProgress.map((progress) => (
                <div
                  className={`plan-stage-list__item ${
                    progress.stage === activeStage && !progress.depthConfirmed ? "plan-stage-list__item--active" : ""
                  }`}
                  key={progress.stage}
                >
                  <span>{stageLabel(progress.stage)}</span>
                  <small>
                    {progress.depthConfirmed
                      ? "Confirmed"
                      : progress.readyForReview
                        ? "Review"
                        : `${progress.answered}/${progress.total}`}
                  </small>
                </div>
              ))}
            </div>

            {latestAnswers.length > 0 ? (
              <div className="plan-memory" data-testid="plan-answer-history">
                <div className="plan-memory__title">Discussion memory</div>
                {latestAnswers.map((answer) => {
                  const question = getDiscussQuestion(answer.questionId);
                  const isEditing = editingAnswerId === answer.id;
                  return (
                    <article className="plan-memory__item" key={answer.id}>
                      <div className="plan-memory__item-header">
                        <span>{question?.label ?? answer.questionId}</span>
                        <button
                          className="plan-inline-button"
                          onClick={() => {
                            setEditingAnswerId(answer.id);
                            setRevisionDraft(answer.answer);
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                      {isEditing ? (
                        <div className="plan-memory__editor">
                          <textarea
                            data-testid="plan-revision-textarea"
                            onChange={(event) => setRevisionDraft(event.target.value)}
                            value={revisionDraft}
                          />
                          <div className="plan-memory__editor-actions">
                            <button
                              className="plan-action-button plan-action-button--compact"
                              disabled={!revisionDraft.trim() || submitting}
                              onClick={() => saveRevision(answer)}
                              type="button"
                            >
                              Save revision
                            </button>
                            <button
                              className="plan-secondary-button plan-secondary-button--compact"
                              onClick={() => {
                                setEditingAnswerId("");
                                setRevisionDraft("");
                              }}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>{answer.answer}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

function stageLabel(stage: DiscussStage): string {
  switch (stage) {
    case "project":
      return "Project";
    case "requirements":
      return "Requirements";
    case "milestone":
      return "Milestone";
  }
}
