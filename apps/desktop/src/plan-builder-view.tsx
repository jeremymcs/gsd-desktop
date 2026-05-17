import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type {
  AnswerRecord,
  GeneratedOutputRecord,
  PlanSnapshot,
  PlanStage,
  StageStatus,
  TaskExecutionRecord,
  TaskExecutionStatus,
  TaskSessionLinkRecord,
  TaskVerificationRecord,
  TaskVerificationStatus,
} from "@pi-gui/gsd-planning";
import type {
  ConfirmPlanningStageInput,
  CreatePlanningPlanInput,
  DesktopAppState,
  LinkPlanningTaskSessionInput,
  PlanningMilestoneDraft,
  PlanningPlanProposalDraft,
  PlanningProjectionSummary,
  PlanningSliceDraft,
  PlanningTaskDraft,
  ProposePlanningPlanInput,
  ProposePlanningResearchInput,
  RecordPlanningAnswerInput,
  RecordPlanningTaskVerificationInput,
  RegeneratePlanningProjectionsInput,
  ReviewPlanningPlanInput,
  ReviewPlanningResearchInput,
  RevisePlanningAnswerInput,
  SelectPlanningPlanInput,
  StartPlanningExecutionInput,
  StartPlanningPlanInput,
  StartPlanningResearchInput,
  StartPlanningVerifyInput,
  UpdatePlanningTaskExecutionInput,
  WorkspacePlanningState,
  WorkspaceRecord,
  WorkspaceSessionTarget,
} from "./desktop-state";
import { ArrowUpIcon, PlanIcon } from "./icons";
import {
  buildPlanProposalDraft,
  nextPlanId,
  parsePlanProposal,
  splitDependencies,
  validatePlanProposal,
} from "./plan-builder-plan";
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
  readonly onStartResearch: (input: StartPlanningResearchInput) => Promise<DesktopAppState>;
  readonly onProposeResearch: (input: ProposePlanningResearchInput) => Promise<DesktopAppState>;
  readonly onReviewResearch: (input: ReviewPlanningResearchInput) => Promise<DesktopAppState>;
  readonly onStartPlan: (input: StartPlanningPlanInput) => Promise<DesktopAppState>;
  readonly onProposePlan: (input: ProposePlanningPlanInput) => Promise<DesktopAppState>;
  readonly onReviewPlan: (input: ReviewPlanningPlanInput) => Promise<DesktopAppState>;
  readonly onStartExecution: (input: StartPlanningExecutionInput) => Promise<DesktopAppState>;
  readonly onLinkTaskSession: (input: LinkPlanningTaskSessionInput) => Promise<DesktopAppState>;
  readonly onUpdateTaskExecution: (input: UpdatePlanningTaskExecutionInput) => Promise<DesktopAppState>;
  readonly onStartVerify: (input: StartPlanningVerifyInput) => Promise<DesktopAppState>;
  readonly onRecordTaskVerification: (input: RecordPlanningTaskVerificationInput) => Promise<DesktopAppState>;
  readonly onOpenTaskSession: (target: WorkspaceSessionTarget) => Promise<DesktopAppState>;
  readonly onRegenerateProjections: (input: RegeneratePlanningProjectionsInput) => Promise<DesktopAppState>;
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
  onStartResearch,
  onProposeResearch,
  onReviewResearch,
  onStartPlan,
  onProposePlan,
  onReviewPlan,
  onStartExecution,
  onLinkTaskSession,
  onUpdateTaskExecution,
  onStartVerify,
  onRecordTaskVerification,
  onOpenTaskSession,
  onRegenerateProjections,
}: PlanBuilderViewProps) {
  const workspace = workspaces.find((entry) => entry.id === selectedWorkspaceId) ?? workspaces[0];
  const [planName, setPlanName] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");
  const [editingAnswerId, setEditingAnswerId] = useState("");
  const [revisionDraft, setRevisionDraft] = useState("");
  const [researchTitle, setResearchTitle] = useState("");
  const [researchContent, setResearchContent] = useState("");
  const [seededResearchPlanId, setSeededResearchPlanId] = useState("");
  const [planProposal, setPlanProposal] = useState<PlanningPlanProposalDraft>(() => emptyPlanProposal());
  const [seededPlanProposalPlanId, setSeededPlanProposalPlanId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const snapshot = planningState?.selectedPlan;
  const activeQuestion = getActiveDiscussQuestion(snapshot);
  const activePlanStage: PlanStage = snapshot?.activeStage ?? "project";
  const activeDiscussStage: DiscussStage =
    snapshot && isDiscussStage(snapshot.activeStage) ? snapshot.activeStage : "project";
  const stageProgress = useMemo(
    () => discussStageOrder.map((stage) => getDiscussStageProgress(snapshot, stage)),
    [snapshot],
  );
  const latestAnswers = useMemo(() => getLatestDiscussAnswers(snapshot), [snapshot]);
  const latestAnswersByQuestion = useMemo(() => getLatestAnswersByQuestion(snapshot), [snapshot]);
  const currentProgress = stageProgress.find((progress) => progress.stage === activeDiscussStage) ?? stageProgress[0];
  const allDiscussConfirmed = stageProgress.every((progress) => progress.depthConfirmed);
  const researchOutputs = useMemo(
    () => (snapshot?.generatedOutputs ?? []).filter((output) => output.stage === "research"),
    [snapshot],
  );
  const pendingResearchOutputs = researchOutputs.filter(
    (output) => output.status === "draft" || output.status === "proposed",
  );
  const acceptedResearchOutputs = researchOutputs.filter((output) => output.status === "accepted");
  const rejectedResearchOutputs = researchOutputs.filter((output) => output.status === "rejected");
  const researchStage = snapshot?.stages.find((stage) => stage.stage === "research");
  const researchStarted = Boolean(
    snapshot && (snapshot.activePhase === "research" || researchStage || researchOutputs.length > 0),
  );
  const researchDraft = useMemo(() => buildResearchDraft(snapshot, latestAnswers), [latestAnswers, snapshot]);
  const planOutputs = useMemo(
    () => (snapshot?.generatedOutputs ?? []).filter((output) => output.stage === "roadmap"),
    [snapshot],
  );
  const pendingPlanOutputs = planOutputs.filter((output) => output.status === "draft" || output.status === "proposed");
  const acceptedPlanOutputs = planOutputs.filter((output) => output.status === "accepted");
  const rejectedPlanOutputs = planOutputs.filter((output) => output.status === "rejected");
  const acceptedPlanProposal = useMemo(() => parseLatestAcceptedPlanProposal(acceptedPlanOutputs), [acceptedPlanOutputs]);
  const roadmapStage = snapshot?.stages.find((stage) => stage.stage === "roadmap");
  const executeStarted = snapshot?.activePhase === "execute";
  const verifyStarted = snapshot?.activePhase === "verify";
  const planStarted = Boolean(snapshot && (snapshot.activePhase === "plan" || roadmapStage || planOutputs.length > 0));
  const planDraft = useMemo(
    () => buildPlanProposalDraft(snapshot, latestAnswers, acceptedResearchOutputs),
    [acceptedResearchOutputs, latestAnswers, snapshot],
  );
  const planValidationIssues = useMemo(() => validatePlanProposal(planProposal), [planProposal]);

  useEffect(() => {
    const existingAnswer = activeQuestion ? latestAnswersByQuestion.get(activeQuestion.id)?.answer : "";
    setAnswerDraft(existingAnswer ?? "");
  }, [activeQuestion?.id, latestAnswersByQuestion, snapshot?.id]);

  useEffect(() => {
    setEditingAnswerId("");
    setRevisionDraft("");
  }, [snapshot?.id]);

  useEffect(() => {
    if (!snapshot || !researchStarted) {
      setResearchTitle("");
      setResearchContent("");
      setSeededResearchPlanId("");
      return;
    }
    if (seededResearchPlanId === snapshot.id) {
      return;
    }
    setResearchTitle("Research brief");
    setResearchContent(researchDraft);
    setSeededResearchPlanId(snapshot.id);
  }, [researchDraft, researchStarted, seededResearchPlanId, snapshot]);

  useEffect(() => {
    if (!snapshot || !planStarted) {
      setPlanProposal(emptyPlanProposal());
      setSeededPlanProposalPlanId("");
      return;
    }
    if (seededPlanProposalPlanId === snapshot.id) {
      return;
    }
    setPlanProposal(planDraft);
    setSeededPlanProposalPlanId(snapshot.id);
  }, [planDraft, planStarted, seededPlanProposalPlanId, snapshot]);

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

  const startResearch = () => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onStartResearch({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const proposeResearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!snapshot || submitting) {
      return;
    }
    const title = researchTitle.trim();
    const content = researchContent.trim();
    if (!title || !content) {
      return;
    }
    setSubmitting(true);
    void onProposeResearch({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      title,
      content,
    })
      .then(() => {
        setResearchTitle("Research brief");
        setResearchContent(researchDraft);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const reviewResearch = (output: GeneratedOutputRecord, status: "accepted" | "rejected") => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onReviewResearch({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      outputId: output.id,
      status,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const startPlan = () => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onStartPlan({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const proposePlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onProposePlan({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      proposal: planProposal,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const reviewPlan = (output: GeneratedOutputRecord, status: "accepted" | "rejected") => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onReviewPlan({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      outputId: output.id,
      status,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const regenerateProjections = () => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onRegenerateProjections({
      workspaceId: workspace.id,
      planId: snapshot.id,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const startExecution = () => {
    if (!snapshot || submitting || acceptedPlanOutputs.length === 0) {
      return;
    }
    setSubmitting(true);
    void onStartExecution({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const linkTaskSession = (task: PlanningTaskDraft, taskPath: string) => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onLinkTaskSession({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      taskId: task.id,
      taskPath,
      taskTitle: task.title,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const openTaskSession = (link: TaskSessionLinkRecord) => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    void onOpenTaskSession({
      workspaceId: link.workspaceId,
      sessionId: link.sessionId,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const updateTaskExecution = (task: PlanningTaskDraft, taskPath: string, draft: TaskExecutionDraft) => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onUpdateTaskExecution({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      taskId: task.id,
      taskPath,
      status: draft.status,
      note: draft.note,
      blocker: draft.status === "blocked" ? draft.blocker : "",
      evidence: draft.evidence,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const startVerify = () => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onStartVerify({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const recordTaskVerification = (task: PlanningTaskDraft, taskPath: string, draft: TaskVerificationDraft) => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onRecordTaskVerification({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      taskId: task.id,
      taskPath,
      status: draft.status,
      note: draft.note,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const updateMilestone = (milestoneIndex: number, patch: Partial<PlanningMilestoneDraft>) => {
    setPlanProposal((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, index) =>
        index === milestoneIndex ? { ...milestone, ...patch } : milestone,
      ),
    }));
  };

  const updateSlice = (milestoneIndex: number, sliceIndex: number, patch: Partial<PlanningSliceDraft>) => {
    setPlanProposal((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, index) =>
        index === milestoneIndex
          ? {
              ...milestone,
              slices: milestone.slices.map((slice, nestedIndex) =>
                nestedIndex === sliceIndex ? { ...slice, ...patch } : slice,
              ),
            }
          : milestone,
      ),
    }));
  };

  const updateTask = (
    milestoneIndex: number,
    sliceIndex: number,
    taskIndex: number,
    patch: Partial<PlanningTaskDraft>,
  ) => {
    setPlanProposal((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, index) =>
        index === milestoneIndex
          ? {
              ...milestone,
              slices: milestone.slices.map((slice, nestedIndex) =>
                nestedIndex === sliceIndex
                  ? {
                      ...slice,
                      tasks: slice.tasks.map((task, taskNestedIndex) =>
                        taskNestedIndex === taskIndex ? { ...task, ...patch } : task,
                      ),
                    }
                  : slice,
              ),
            }
          : milestone,
      ),
    }));
  };

  const addMilestone = () => {
    setPlanProposal((current) => {
      const milestoneId = nextPlanId("M", current.milestones.map((milestone) => milestone.id));
      const taskId = nextPlanId(
        "T",
        current.milestones.flatMap((entry) =>
          entry.slices.flatMap((nestedSlice) => nestedSlice.tasks.map((task) => task.id)),
        ),
      );
      return {
        ...current,
        milestones: [
          ...current.milestones,
          {
            id: milestoneId,
            title: "New milestone",
            phase: "PLAN",
            outcome: "Define the milestone outcome.",
            slices: [
              {
                id: "S1",
                title: "New slice",
                goal: "Define the slice goal.",
                boundary: "Name the touched boundary.",
                tasks: [
                  {
                    id: taskId,
                    title: "New task",
                    acceptance: "Define the acceptance signal.",
                    dependencies: [],
                  },
                ],
              },
            ],
          },
        ],
      };
    });
  };

  const removeMilestone = (milestoneIndex: number) => {
    setPlanProposal((current) => ({
      ...current,
      milestones: current.milestones.filter((_milestone, index) => index !== milestoneIndex),
    }));
  };

  const addSlice = (milestoneIndex: number) => {
    setPlanProposal((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, index) => {
        if (index !== milestoneIndex) {
          return milestone;
        }
        const sliceId = nextPlanId("S", milestone.slices.map((slice) => slice.id));
        return {
          ...milestone,
          slices: [
            ...milestone.slices,
            {
              id: sliceId,
              title: "New slice",
              goal: "Define the slice goal.",
              boundary: "Name the touched boundary.",
              tasks: [],
            },
          ],
        };
      }),
    }));
  };

  const removeSlice = (milestoneIndex: number, sliceIndex: number) => {
    setPlanProposal((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, index) =>
        index === milestoneIndex
          ? { ...milestone, slices: milestone.slices.filter((_slice, nestedIndex) => nestedIndex !== sliceIndex) }
          : milestone,
      ),
    }));
  };

  const addTask = (milestoneIndex: number, sliceIndex: number) => {
    setPlanProposal((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, index) =>
        index === milestoneIndex
          ? {
              ...milestone,
              slices: milestone.slices.map((slice, nestedIndex) => {
                if (nestedIndex !== sliceIndex) {
                  return slice;
                }
                const existingTaskIds = current.milestones.flatMap((entry) =>
                  entry.slices.flatMap((nestedSlice) => nestedSlice.tasks.map((task) => task.id)),
                );
                return {
                  ...slice,
                  tasks: [
                    ...slice.tasks,
                    {
                      id: nextPlanId("T", existingTaskIds),
                      title: "New task",
                      acceptance: "Define the acceptance signal.",
                      dependencies: [],
                    },
                  ],
                };
              }),
            }
          : milestone,
      ),
    }));
  };

  const removeTask = (milestoneIndex: number, sliceIndex: number, taskIndex: number) => {
    setPlanProposal((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, index) =>
        index === milestoneIndex
          ? {
              ...milestone,
              slices: milestone.slices.map((slice, nestedIndex) =>
                nestedIndex === sliceIndex
                  ? { ...slice, tasks: slice.tasks.filter((_task, taskNestedIndex) => taskNestedIndex !== taskIndex) }
                  : slice,
              ),
            }
          : milestone,
      ),
    }));
  };

  const answerCount = latestAnswers.filter((answer) => answer.loadBearing).length;
  const outlineStats = [
    { label: "Answers", value: String(answerCount) },
    { label: "Research", value: `${acceptedResearchOutputs.length}/${researchOutputs.length}` },
    { label: "Plan", value: `${acceptedPlanOutputs.length}/${planOutputs.length}` },
    { label: "Revision", value: String(snapshot?.revision ?? 0) },
  ] as const;
  const composerStatus = activeQuestion
    ? activeQuestion.prompt
    : verifyStarted
      ? "VERIFY gate is active; check completed tasks against acceptance"
      : executeStarted
      ? "EXECUTE queue is active; create or open linked task sessions"
    : planStarted
      ? "Structured plan proposals are validated before approval"
    : researchStarted
      ? "Reviewable research is persisted in the planning database"
      : allDiscussConfirmed
        ? "Start research when you are ready to stage findings"
        : snapshot
          ? "DISCUSS memory is persisted in the planning database"
          : "Start with the project outcome, constraints, and users";

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
            ) : allDiscussConfirmed && !researchStarted ? (
              <div className="plan-depth-card plan-depth-card--complete" data-testid="plan-discuss-complete">
                <div className="plan-depth-card__eyebrow">DISCUSS complete</div>
                <h2>Ready for RESEARCH</h2>
                <p>The project, requirements, and milestone depth gates are confirmed.</p>
                <button className="plan-action-button" disabled={submitting} onClick={startResearch} type="button">
                  Start research
                </button>
              </div>
            ) : allDiscussConfirmed && researchStarted && acceptedResearchOutputs.length === 0 ? (
              <div className="plan-research" data-testid="plan-research-panel">
                <div className="plan-depth-card plan-depth-card--complete" data-testid="plan-discuss-complete">
                  <div className="plan-depth-card__eyebrow">RESEARCH {formatStageStatus(researchStage?.status)}</div>
                  <h2>Stage research findings</h2>
                  <p>Proposed research stays reviewable until it is accepted or rejected.</p>
                </div>

                <form className="plan-research-form" onSubmit={proposeResearch}>
                  <label className="plan-research-form__field">
                    <span>Title</span>
                    <input
                      autoComplete="off"
                      data-testid="research-title-input"
                      onChange={(event) => setResearchTitle(event.target.value)}
                      value={researchTitle}
                    />
                  </label>
                  <label className="plan-research-form__field">
                    <span>Findings</span>
                    <textarea
                      data-testid="research-content-textarea"
                      onChange={(event) => setResearchContent(event.target.value)}
                      value={researchContent}
                    />
                  </label>
                  <div className="plan-question-card__actions">
                    <button
                      className="plan-action-button"
                      disabled={!researchTitle.trim() || !researchContent.trim() || submitting}
                      type="submit"
                    >
                      Stage research
                    </button>
                  </div>
                </form>

                {pendingResearchOutputs.length > 0 ? (
                  <div className="plan-research-list" data-testid="research-output-proposed">
                    <div className="plan-memory__title">Pending review</div>
                    {pendingResearchOutputs.map((output) => (
                      <ResearchOutputCard key={output.id} output={output}>
                        <button
                          className="plan-action-button plan-action-button--compact"
                          disabled={submitting}
                          onClick={() => reviewResearch(output, "accepted")}
                          type="button"
                        >
                          Accept
                        </button>
                        <button
                          className="plan-secondary-button plan-secondary-button--compact"
                          disabled={submitting}
                          onClick={() => reviewResearch(output, "rejected")}
                          type="button"
                        >
                          Reject
                        </button>
                      </ResearchOutputCard>
                    ))}
                  </div>
                ) : null}

                {acceptedResearchOutputs.length > 0 ? (
                  <div className="plan-research-list" data-testid="research-output-accepted">
                    <div className="plan-memory__title">Accepted research</div>
                    {acceptedResearchOutputs.map((output) => (
                      <ResearchOutputCard key={output.id} output={output} />
                    ))}
                  </div>
                ) : null}

                {rejectedResearchOutputs.length > 0 ? (
                  <div className="plan-research-list" data-testid="research-output-rejected">
                    <div className="plan-memory__title">Rejected research</div>
                    {rejectedResearchOutputs.map((output) => (
                      <ResearchOutputCard key={output.id} output={output} />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : allDiscussConfirmed && acceptedResearchOutputs.length > 0 && !planStarted ? (
              <div className="plan-depth-card plan-depth-card--complete" data-testid="plan-ready-card">
                <div className="plan-depth-card__eyebrow">RESEARCH approved</div>
                <h2>Ready for PLAN</h2>
                <p>Accepted research is available. Structure milestones, slices, tasks, dependencies, and boundaries next.</p>
                <button className="plan-action-button" disabled={submitting} onClick={startPlan} type="button">
                  Start plan
                </button>
              </div>
            ) : allDiscussConfirmed && verifyStarted ? (
              <PlanVerifyGate
                acceptedPlanProposal={acceptedPlanProposal}
                submitting={submitting}
                taskExecutions={snapshot.taskExecutions ?? []}
                taskVerifications={snapshot.taskVerifications ?? []}
                onRecordTaskVerification={recordTaskVerification}
              />
            ) : allDiscussConfirmed && executeStarted ? (
              <PlanExecutionQueue
                acceptedPlanProposal={acceptedPlanProposal}
                projectionSummary={planningState?.projectionSummary}
                submitting={submitting}
                taskExecutions={snapshot.taskExecutions ?? []}
                taskSessionLinks={snapshot.taskSessionLinks ?? []}
                onLinkTaskSession={linkTaskSession}
                onStartVerify={startVerify}
                onUpdateTaskExecution={updateTaskExecution}
                onOpenTaskSession={openTaskSession}
                onRegenerateProjections={regenerateProjections}
              />
            ) : allDiscussConfirmed && planStarted ? (
              <PlanProposalEditor
                acceptedPlanOutputs={acceptedPlanOutputs}
                lastError={lastError}
                pendingPlanOutputs={pendingPlanOutputs}
                planProposal={planProposal}
                projectionSummary={planningState?.projectionSummary}
                rejectedPlanOutputs={rejectedPlanOutputs}
                roadmapStatus={roadmapStage?.status}
                submitting={submitting}
                validationIssues={planValidationIssues}
                onAddMilestone={addMilestone}
                onAddSlice={addSlice}
                onAddTask={addTask}
                onBoundaryMapChange={(value) => setPlanProposal((current) => ({ ...current, boundaryMap: value }))}
                onIdeaPoolChange={(value) => setPlanProposal((current) => ({ ...current, ideaPool: value }))}
                onProposePlan={proposePlan}
                onRegenerateProjections={regenerateProjections}
                onStartExecution={startExecution}
                onRemoveMilestone={removeMilestone}
                onRemoveSlice={removeSlice}
                onRemoveTask={removeTask}
                onReviewPlan={reviewPlan}
                onUpdateMilestone={updateMilestone}
                onUpdateSlice={updateSlice}
                onUpdateTask={updateTask}
              />
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
              <span>{composerStatus}</span>
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
                {snapshot ? `${snapshot.readableId} · ${stageLabel(activePlanStage)}` : "DISCUSS is ready to start"}
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
                    progress.stage === activePlanStage && !progress.depthConfirmed ? "plan-stage-list__item--active" : ""
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
              <div
                className={`plan-stage-list__item ${
                  activePlanStage === "research" && researchStage?.status !== "approved"
                    ? "plan-stage-list__item--active"
                    : ""
                }`}
              >
                <span>Research</span>
                <small>{formatResearchStatus(researchStage?.status, researchOutputs.length)}</small>
              </div>
              <div
                className={`plan-stage-list__item ${
                  activePlanStage === "roadmap" && roadmapStage?.status !== "approved"
                    ? "plan-stage-list__item--active"
                    : ""
                }`}
              >
                <span>Plan</span>
                <small>{formatPlanStatus(roadmapStage?.status, planOutputs.length)}</small>
              </div>
              <div className={`plan-stage-list__item ${executeStarted ? "plan-stage-list__item--active" : ""}`}>
                <span>Execute</span>
                <small>{formatExecuteStatus(executeStarted, acceptedPlanOutputs.length)}</small>
              </div>
              <div className={`plan-stage-list__item ${verifyStarted ? "plan-stage-list__item--active" : ""}`}>
                <span>Verify</span>
                <small>{formatVerifyStatus(verifyStarted, snapshot?.taskVerifications?.length ?? 0)}</small>
              </div>
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

function PlanProposalEditor({
  acceptedPlanOutputs,
  lastError,
  pendingPlanOutputs,
  planProposal,
  projectionSummary,
  rejectedPlanOutputs,
  roadmapStatus,
  submitting,
  validationIssues,
  onAddMilestone,
  onAddSlice,
  onAddTask,
  onBoundaryMapChange,
  onIdeaPoolChange,
  onProposePlan,
  onRegenerateProjections,
  onStartExecution,
  onRemoveMilestone,
  onRemoveSlice,
  onRemoveTask,
  onReviewPlan,
  onUpdateMilestone,
  onUpdateSlice,
  onUpdateTask,
}: {
  readonly acceptedPlanOutputs: readonly GeneratedOutputRecord[];
  readonly lastError?: string;
  readonly pendingPlanOutputs: readonly GeneratedOutputRecord[];
  readonly planProposal: PlanningPlanProposalDraft;
  readonly projectionSummary?: PlanningProjectionSummary;
  readonly rejectedPlanOutputs: readonly GeneratedOutputRecord[];
  readonly roadmapStatus?: StageStatus;
  readonly submitting: boolean;
  readonly validationIssues: readonly { readonly id: string; readonly path: string; readonly message: string }[];
  readonly onAddMilestone: () => void;
  readonly onAddSlice: (milestoneIndex: number) => void;
  readonly onAddTask: (milestoneIndex: number, sliceIndex: number) => void;
  readonly onBoundaryMapChange: (value: string) => void;
  readonly onIdeaPoolChange: (value: string) => void;
  readonly onProposePlan: (event: FormEvent<HTMLFormElement>) => void;
  readonly onRegenerateProjections: () => void;
  readonly onStartExecution: () => void;
  readonly onRemoveMilestone: (milestoneIndex: number) => void;
  readonly onRemoveSlice: (milestoneIndex: number, sliceIndex: number) => void;
  readonly onRemoveTask: (milestoneIndex: number, sliceIndex: number, taskIndex: number) => void;
  readonly onReviewPlan: (output: GeneratedOutputRecord, status: "accepted" | "rejected") => void;
  readonly onUpdateMilestone: (milestoneIndex: number, patch: Partial<PlanningMilestoneDraft>) => void;
  readonly onUpdateSlice: (milestoneIndex: number, sliceIndex: number, patch: Partial<PlanningSliceDraft>) => void;
  readonly onUpdateTask: (
    milestoneIndex: number,
    sliceIndex: number,
    taskIndex: number,
    patch: Partial<PlanningTaskDraft>,
  ) => void;
}) {
  const projectionStatus = projectionSummary
    ? projectionSummary.conflicts.length > 0
      ? `${projectionSummary.conflicts.length} legacy file conflict${projectionSummary.conflicts.length === 1 ? "" : "s"}`
      : `${projectionSummary.written} written / ${projectionSummary.skipped} unchanged`
    : "Ready to regenerate generated Markdown files";

  return (
    <div className="plan-roadmap" data-testid="plan-proposal-panel">
      <div className="plan-depth-card plan-depth-card--complete">
        <div className="plan-depth-card__eyebrow">PLAN {formatStageStatus(roadmapStatus)}</div>
        <h2>Build the execution plan</h2>
        <p>Structure milestones, slices, tasks, dependencies, and boundaries before approval.</p>
      </div>

      {acceptedPlanOutputs.length > 0 ? (
        <div
          className={`plan-projection-card ${
            projectionSummary?.conflicts.length ? "plan-projection-card--blocked" : ""
          }`}
          data-testid="projection-summary"
        >
          <div>
            <strong>Projections</strong>
            <span>{projectionStatus}</span>
          </div>
          <button
            className="plan-secondary-button plan-secondary-button--compact"
            data-testid="regenerate-projections-button"
            disabled={submitting}
            onClick={onRegenerateProjections}
            type="button"
          >
            Regenerate projections
          </button>
          <button
            className="plan-action-button plan-action-button--compact"
            data-testid="start-execution-button"
            disabled={submitting || Boolean(projectionSummary?.conflicts.length)}
            onClick={onStartExecution}
            type="button"
          >
            Start execute
          </button>
        </div>
      ) : null}

      <form className="plan-roadmap-form" onSubmit={onProposePlan}>
        <label className="plan-roadmap-form__field">
          <span>Boundary map</span>
          <textarea
            data-testid="plan-boundary-map-textarea"
            onChange={(event) => onBoundaryMapChange(event.target.value)}
            value={planProposal.boundaryMap}
          />
        </label>
        <label className="plan-roadmap-form__field">
          <span>Idea pool</span>
          <textarea
            data-testid="plan-idea-pool-textarea"
            onChange={(event) => onIdeaPoolChange(event.target.value)}
            value={planProposal.ideaPool}
          />
        </label>

        <div className="plan-roadmap-list">
          {planProposal.milestones.map((milestone, milestoneIndex) => (
            <article className="plan-roadmap-card" key={`${milestone.id}-${milestoneIndex}`}>
              <div className="plan-roadmap-card__header">
                <span>{milestone.id || `M${milestoneIndex + 1}`}</span>
                <button
                  className="plan-inline-button"
                  onClick={() => onRemoveMilestone(milestoneIndex)}
                  type="button"
                >
                  Delete milestone
                </button>
              </div>
              <div className="plan-roadmap-grid">
                <label className="plan-roadmap-form__field">
                  <span>Milestone title</span>
                  <input
                    data-testid={milestoneIndex === 0 ? "plan-milestone-title-input" : undefined}
                    onChange={(event) => onUpdateMilestone(milestoneIndex, { title: event.target.value })}
                    value={milestone.title}
                  />
                </label>
                <label className="plan-roadmap-form__field">
                  <span>Phase</span>
                  <input
                    onChange={(event) => onUpdateMilestone(milestoneIndex, { phase: event.target.value })}
                    value={milestone.phase}
                  />
                </label>
              </div>
              <label className="plan-roadmap-form__field">
                <span>Outcome</span>
                <textarea
                  onChange={(event) => onUpdateMilestone(milestoneIndex, { outcome: event.target.value })}
                  value={milestone.outcome}
                />
              </label>

              {milestone.slices.map((slice, sliceIndex) => (
                <div className="plan-roadmap-nested" key={`${slice.id}-${sliceIndex}`}>
                  <div className="plan-roadmap-card__header">
                    <span>{slice.id || `S${sliceIndex + 1}`}</span>
                    <button
                      className="plan-inline-button"
                      onClick={() => onRemoveSlice(milestoneIndex, sliceIndex)}
                      type="button"
                    >
                      Delete slice
                    </button>
                  </div>
                  <label className="plan-roadmap-form__field">
                    <span>Slice title</span>
                    <input
                      data-testid={milestoneIndex === 0 && sliceIndex === 0 ? "plan-slice-title-input" : undefined}
                      onChange={(event) => onUpdateSlice(milestoneIndex, sliceIndex, { title: event.target.value })}
                      value={slice.title}
                    />
                  </label>
                  <label className="plan-roadmap-form__field">
                    <span>Goal</span>
                    <textarea
                      onChange={(event) => onUpdateSlice(milestoneIndex, sliceIndex, { goal: event.target.value })}
                      value={slice.goal}
                    />
                  </label>
                  <label className="plan-roadmap-form__field">
                    <span>Boundary</span>
                    <textarea
                      onChange={(event) => onUpdateSlice(milestoneIndex, sliceIndex, { boundary: event.target.value })}
                      value={slice.boundary}
                    />
                  </label>

                  {slice.tasks.map((task, taskIndex) => (
                    <div className="plan-task-row" key={`${task.id}-${taskIndex}`}>
                      <div className="plan-roadmap-card__header">
                        <span>{task.id || `T${taskIndex + 1}`}</span>
                        <button
                          className="plan-inline-button"
                          onClick={() => onRemoveTask(milestoneIndex, sliceIndex, taskIndex)}
                          type="button"
                        >
                          Delete task
                        </button>
                      </div>
                      <label className="plan-roadmap-form__field">
                        <span>Task title</span>
                        <input
                          data-testid={
                            milestoneIndex === 0 && sliceIndex === 0 && taskIndex === 0
                              ? "plan-task-title-input"
                              : undefined
                          }
                          onChange={(event) =>
                            onUpdateTask(milestoneIndex, sliceIndex, taskIndex, { title: event.target.value })
                          }
                          value={task.title}
                        />
                      </label>
                      <label className="plan-roadmap-form__field">
                        <span>Acceptance</span>
                        <textarea
                          onChange={(event) =>
                            onUpdateTask(milestoneIndex, sliceIndex, taskIndex, { acceptance: event.target.value })
                          }
                          value={task.acceptance}
                        />
                      </label>
                      <label className="plan-roadmap-form__field">
                        <span>Dependencies</span>
                        <input
                          data-testid={
                            milestoneIndex === 0 && sliceIndex === 0 && taskIndex === 0
                              ? "plan-task-dependencies-input"
                              : undefined
                          }
                          onChange={(event) =>
                            onUpdateTask(milestoneIndex, sliceIndex, taskIndex, {
                              dependencies: splitDependencies(event.target.value),
                            })
                          }
                          placeholder="T1, T2"
                          value={task.dependencies.join(", ")}
                        />
                      </label>
                    </div>
                  ))}

                  <button
                    className="plan-secondary-button plan-secondary-button--compact"
                    onClick={() => onAddTask(milestoneIndex, sliceIndex)}
                    type="button"
                  >
                    Add task
                  </button>
                </div>
              ))}

              <button
                className="plan-secondary-button plan-secondary-button--compact"
                onClick={() => onAddSlice(milestoneIndex)}
                type="button"
              >
                Add slice
              </button>
            </article>
          ))}
        </div>

        <button className="plan-secondary-button" onClick={onAddMilestone} type="button">
          Add milestone
        </button>

        <ValidationPanel issues={validationIssues} />
        {lastError ? <div className="plan-error">{lastError}</div> : null}

        <button className="plan-action-button" disabled={submitting} type="submit">
          Stage plan
        </button>
      </form>

      {pendingPlanOutputs.length > 0 ? (
        <div className="plan-research-list" data-testid="plan-output-proposed">
          <div className="plan-memory__title">Pending plan review</div>
          {pendingPlanOutputs.map((output) => (
            <PlanOutputCard key={output.id} output={output} submitting={submitting} onReviewPlan={onReviewPlan} />
          ))}
        </div>
      ) : null}

      {acceptedPlanOutputs.length > 0 ? (
        <div className="plan-research-list" data-testid="plan-output-accepted">
          <div className="plan-memory__title">Accepted plan</div>
          {acceptedPlanOutputs.map((output) => (
            <PlanOutputCard key={output.id} output={output} submitting={submitting} onReviewPlan={onReviewPlan} />
          ))}
        </div>
      ) : null}

      {rejectedPlanOutputs.length > 0 ? (
        <div className="plan-research-list" data-testid="plan-output-rejected">
          <div className="plan-memory__title">Rejected plan</div>
          {rejectedPlanOutputs.map((output) => (
            <PlanOutputCard key={output.id} output={output} submitting={submitting} onReviewPlan={onReviewPlan} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface TaskExecutionDraft {
  readonly status: TaskExecutionStatus;
  readonly note: string;
  readonly blocker: string;
  readonly evidence: string;
}

interface TaskVerificationDraft {
  readonly status: TaskVerificationStatus;
  readonly note: string;
}

interface PlanTaskEntry {
  readonly task: PlanningTaskDraft;
  readonly taskPath: string;
  readonly acceptance: string;
}

function PlanExecutionQueue({
  acceptedPlanProposal,
  projectionSummary,
  submitting,
  taskExecutions,
  taskSessionLinks,
  onLinkTaskSession,
  onStartVerify,
  onUpdateTaskExecution,
  onOpenTaskSession,
  onRegenerateProjections,
}: {
  readonly acceptedPlanProposal: PlanningPlanProposalDraft | undefined;
  readonly projectionSummary?: PlanningProjectionSummary;
  readonly submitting: boolean;
  readonly taskExecutions: readonly TaskExecutionRecord[];
  readonly taskSessionLinks: readonly TaskSessionLinkRecord[];
  readonly onLinkTaskSession: (task: PlanningTaskDraft, taskPath: string) => void;
  readonly onStartVerify: () => void;
  readonly onUpdateTaskExecution: (task: PlanningTaskDraft, taskPath: string, draft: TaskExecutionDraft) => void;
  readonly onOpenTaskSession: (link: TaskSessionLinkRecord) => void;
  readonly onRegenerateProjections: () => void;
}) {
  const [taskDrafts, setTaskDrafts] = useState<Record<string, TaskExecutionDraft>>({});
  const taskCount = acceptedPlanProposal?.milestones.reduce(
    (total, milestone) => total + milestone.slices.reduce((sliceTotal, slice) => sliceTotal + slice.tasks.length, 0),
    0,
  ) ?? 0;
  const taskLinks = useMemo(() => new Map(taskSessionLinks.map((link) => [link.taskId, link])), [taskSessionLinks]);
  const taskExecutionMap = useMemo(
    () => new Map(taskExecutions.map((execution) => [execution.taskId, execution])),
    [taskExecutions],
  );
  const planTasks = useMemo(
    () => (acceptedPlanProposal ? getPlanTaskEntries(acceptedPlanProposal) : []),
    [acceptedPlanProposal],
  );
  const verifyReady =
    planTasks.length > 0 &&
    planTasks.every(({ task }) => {
      const execution = taskExecutionMap.get(task.id);
      return execution?.status === "done" && execution.evidence.length > 0;
    });

  const getTaskDraft = (taskId: string, execution: TaskExecutionRecord | undefined): TaskExecutionDraft =>
    taskDrafts[taskId] ?? {
      status: execution?.status ?? "not-started",
      note: execution?.note ?? "",
      blocker: execution?.blocker ?? "",
      evidence: "",
    };

  const updateTaskDraft = (taskId: string, patch: Partial<TaskExecutionDraft>) => {
    const execution = taskExecutionMap.get(taskId);
    setTaskDrafts((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? {
          status: execution?.status ?? "not-started",
          note: execution?.note ?? "",
          blocker: execution?.blocker ?? "",
          evidence: "",
        }),
        ...patch,
      },
    }));
  };

  const submitTaskDraft = (task: PlanningTaskDraft, taskPath: string, execution: TaskExecutionRecord | undefined) => {
    const draft = getTaskDraft(task.id, execution);
    onUpdateTaskExecution(task, taskPath, draft);
    setTaskDrafts((current) => ({
      ...current,
      [task.id]: {
        ...draft,
        blocker: draft.status === "blocked" ? draft.blocker : "",
        evidence: "",
      },
    }));
  };

  return (
    <div className="plan-execution" data-testid="plan-execution-panel">
      <div className="plan-depth-card plan-depth-card--complete">
        <div className="plan-depth-card__eyebrow">EXECUTE · ACTIVE</div>
        <h2>Execution queue</h2>
        <p>
          {acceptedPlanProposal
            ? `${acceptedPlanProposal.milestones.length} milestone${acceptedPlanProposal.milestones.length === 1 ? "" : "s"} and ${taskCount} task${taskCount === 1 ? "" : "s"} are ready for linked execution sessions.`
            : "Accepted plan content could not be loaded."}
        </p>
      </div>

      <div className="plan-projection-card" data-testid="execution-projection-summary">
        <div>
          <strong>Projection state</strong>
          <span>
            {projectionSummary
              ? `${projectionSummary.written} written / ${projectionSummary.skipped} unchanged`
              : "Generated files are available from the accepted plan"}
          </span>
        </div>
        <button
          className="plan-secondary-button plan-secondary-button--compact"
          disabled={submitting}
          onClick={onRegenerateProjections}
          type="button"
        >
          Regenerate projections
        </button>
        <button
          className="plan-action-button plan-action-button--compact"
          data-testid="start-verify-button"
          disabled={submitting || !verifyReady}
          onClick={onStartVerify}
          type="button"
        >
          Start verify
        </button>
      </div>

      {acceptedPlanProposal ? (
        <div className="plan-execution-list">
          {acceptedPlanProposal.milestones.map((milestone) => (
            <section className="plan-execution-milestone" key={milestone.id} data-testid="execution-milestone">
              <div className="plan-execution-milestone__header">
                <span>{milestone.id}</span>
                <strong>{milestone.title}</strong>
              </div>
              <p>{milestone.outcome}</p>
              {milestone.slices.map((slice) => (
                <div className="plan-execution-slice" key={slice.id}>
                  <div className="plan-execution-slice__header">
                    <span>{slice.id}</span>
                    <strong>{slice.title}</strong>
                    <small>{slice.tasks.length} task{slice.tasks.length === 1 ? "" : "s"}</small>
                  </div>
                  <p>{slice.goal}</p>
                  <div className="plan-execution-task-list">
                    {slice.tasks.map((task) => {
                      const taskPath = `${milestone.id}/${slice.id}/${task.id}`;
                      const linkedSession = taskLinks.get(task.id);
                      const taskExecution = taskExecutionMap.get(task.id);
                      const taskDraft = getTaskDraft(task.id, taskExecution);
                      const taskSaveBlocked =
                        submitting ||
                        (taskDraft.status === "blocked" && !taskDraft.blocker.trim()) ||
                        (taskDraft.status === "done" &&
                          !taskDraft.evidence.trim() &&
                          !(taskExecution?.evidence.length ?? 0));
                      return (
                        <article className="plan-execution-task" key={task.id} data-testid="execution-task">
                          <div className="plan-execution-task__header">
                            <span>{task.id}</span>
                            <strong>{task.title}</strong>
                            <span
                              className={`plan-execution-task__status plan-execution-task__status--${taskExecution?.status ?? "not-started"}`}
                              data-testid="task-status-pill"
                            >
                              {formatTaskExecutionStatus(taskExecution?.status ?? "not-started")}
                            </span>
                          </div>
                          <p>{task.acceptance}</p>
                          {taskExecution?.note ? (
                            <p className="plan-execution-task__note" data-testid="task-note">
                              Note: {taskExecution.note}
                            </p>
                          ) : null}
                          {taskExecution?.blocker ? (
                            <p className="plan-execution-task__blocker" data-testid="task-blocker">
                              Blocker: {taskExecution.blocker}
                            </p>
                          ) : null}
                          {taskExecution?.evidence.length ? (
                            <div className="plan-execution-evidence" data-testid="task-evidence-list">
                              {taskExecution.evidence.map((evidence) => (
                                <span key={evidence.id}>{evidence.text}</span>
                              ))}
                            </div>
                          ) : null}
                          <div className="plan-execution-task__footer">
                            <small>
                              {task.dependencies.length > 0 ? `Depends on ${task.dependencies.join(", ")}` : "Ready"}
                            </small>
                            {linkedSession ? (
                              <>
                                <span className="plan-execution-task__link" data-testid="execution-task-link">
                                  Linked session: {linkedSession.title}
                                </span>
                                <button
                                  className="plan-secondary-button plan-secondary-button--compact"
                                  data-testid="open-task-session-button"
                                  disabled={submitting}
                                  onClick={() => onOpenTaskSession(linkedSession)}
                                  type="button"
                                >
                                  Open session
                                </button>
                              </>
                            ) : (
                              <button
                                className="plan-action-button plan-action-button--compact"
                                data-testid="link-task-session-button"
                                disabled={submitting}
                                onClick={() => onLinkTaskSession(task, taskPath)}
                                type="button"
                              >
                                Create session
                              </button>
                            )}
                          </div>
                          <div className="plan-execution-task-editor">
                            <label className="plan-execution-task-editor__field">
                              <span>Status</span>
                              <select
                                data-testid="task-status-select"
                                onChange={(event) =>
                                  updateTaskDraft(task.id, { status: event.target.value as TaskExecutionStatus })
                                }
                                value={taskDraft.status}
                              >
                                <option value="not-started">Not started</option>
                                <option value="in-progress">In progress</option>
                                <option value="blocked">Blocked</option>
                                <option value="done">Done</option>
                              </select>
                            </label>
                            <label className="plan-execution-task-editor__field">
                              <span>Note</span>
                              <textarea
                                data-testid="task-note-textarea"
                                onChange={(event) => updateTaskDraft(task.id, { note: event.target.value })}
                                value={taskDraft.note}
                              />
                            </label>
                            {taskDraft.status === "blocked" ? (
                              <label className="plan-execution-task-editor__field">
                                <span>Blocker</span>
                                <textarea
                                  data-testid="task-blocker-textarea"
                                  onChange={(event) => updateTaskDraft(task.id, { blocker: event.target.value })}
                                  value={taskDraft.blocker}
                                />
                              </label>
                            ) : null}
                            <label className="plan-execution-task-editor__field">
                              <span>Evidence</span>
                              <textarea
                                data-testid="task-evidence-textarea"
                                onChange={(event) => updateTaskDraft(task.id, { evidence: event.target.value })}
                                value={taskDraft.evidence}
                              />
                            </label>
                            <button
                              className="plan-action-button plan-action-button--compact"
                              data-testid="update-task-execution-button"
                              disabled={taskSaveBlocked}
                              onClick={() => submitTaskDraft(task, taskPath, taskExecution)}
                              type="button"
                            >
                              Save task state
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PlanVerifyGate({
  acceptedPlanProposal,
  submitting,
  taskExecutions,
  taskVerifications,
  onRecordTaskVerification,
}: {
  readonly acceptedPlanProposal: PlanningPlanProposalDraft | undefined;
  readonly submitting: boolean;
  readonly taskExecutions: readonly TaskExecutionRecord[];
  readonly taskVerifications: readonly TaskVerificationRecord[];
  readonly onRecordTaskVerification: (
    task: PlanningTaskDraft,
    taskPath: string,
    draft: TaskVerificationDraft,
  ) => void;
}) {
  const [verificationDrafts, setVerificationDrafts] = useState<Record<string, TaskVerificationDraft>>({});
  const planTasks = useMemo(
    () => (acceptedPlanProposal ? getPlanTaskEntries(acceptedPlanProposal) : []),
    [acceptedPlanProposal],
  );
  const taskExecutionMap = useMemo(
    () => new Map(taskExecutions.map((execution) => [execution.taskId, execution])),
    [taskExecutions],
  );
  const taskVerificationMap = useMemo(
    () => new Map(taskVerifications.map((verification) => [verification.taskId, verification])),
    [taskVerifications],
  );
  const passedCount = planTasks.filter(({ task }) => taskVerificationMap.get(task.id)?.status === "passed").length;
  const allPassed = planTasks.length > 0 && passedCount === planTasks.length;

  const getDraft = (taskId: string, verification: TaskVerificationRecord | undefined): TaskVerificationDraft =>
    verificationDrafts[taskId] ?? {
      status: verification?.status ?? "passed",
      note: verification?.note ?? "",
    };

  const updateDraft = (taskId: string, patch: Partial<TaskVerificationDraft>) => {
    const verification = taskVerificationMap.get(taskId);
    setVerificationDrafts((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? {
          status: verification?.status ?? "passed",
          note: verification?.note ?? "",
        }),
        ...patch,
      },
    }));
  };

  const submitDraft = (entry: PlanTaskEntry, verification: TaskVerificationRecord | undefined) => {
    const draft = getDraft(entry.task.id, verification);
    onRecordTaskVerification(entry.task, entry.taskPath, draft);
  };

  return (
    <div className="plan-execution" data-testid="plan-verify-panel">
      <div className="plan-depth-card plan-depth-card--complete">
        <div className="plan-depth-card__eyebrow">VERIFY · ACTIVE</div>
        <h2>Verification gate</h2>
        <p>
          {acceptedPlanProposal
            ? `${passedCount}/${planTasks.length} task${planTasks.length === 1 ? "" : "s"} passed against acceptance.`
            : "Accepted plan content could not be loaded."}
        </p>
      </div>

      {allPassed ? (
        <div className="plan-projection-card" data-testid="verify-ready-to-ship">
          <div>
            <strong>VERIFY complete</strong>
            <span>All task acceptance checks passed. SHIP remains the next explicit gate.</span>
          </div>
        </div>
      ) : null}

      {acceptedPlanProposal ? (
        <div className="plan-execution-list">
          {planTasks.map((entry) => {
            const execution = taskExecutionMap.get(entry.task.id);
            const verification = taskVerificationMap.get(entry.task.id);
            const draft = getDraft(entry.task.id, verification);
            const saveBlocked = submitting || (draft.status === "failed" && !draft.note.trim());
            return (
              <article className="plan-execution-task" key={entry.taskPath} data-testid="verify-task">
                <div className="plan-execution-task__header">
                  <span>{entry.task.id}</span>
                  <strong>{entry.task.title}</strong>
                  <span
                    className={`plan-execution-task__status plan-execution-task__status--${verification?.status ?? "pending"}`}
                    data-testid="task-verification-status"
                  >
                    {formatTaskVerificationStatus(verification?.status)}
                  </span>
                </div>
                <p>{entry.acceptance}</p>
                {execution?.evidence.length ? (
                  <div className="plan-execution-evidence" data-testid="verify-evidence-list">
                    {execution.evidence.map((evidence) => (
                      <span key={evidence.id}>{evidence.text}</span>
                    ))}
                  </div>
                ) : null}
                {verification?.note ? (
                  <p className="plan-execution-task__note" data-testid="task-verification-note">
                    Verification: {verification.note}
                  </p>
                ) : null}
                <div className="plan-execution-task-editor plan-execution-task-editor--verify">
                  <label className="plan-execution-task-editor__field">
                    <span>Result</span>
                    <select
                      data-testid="task-verification-status-select"
                      onChange={(event) =>
                        updateDraft(entry.task.id, { status: event.target.value as TaskVerificationStatus })
                      }
                      value={draft.status}
                    >
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </label>
                  <label className="plan-execution-task-editor__field">
                    <span>Verification note</span>
                    <textarea
                      data-testid="task-verification-note-textarea"
                      onChange={(event) => updateDraft(entry.task.id, { note: event.target.value })}
                      value={draft.note}
                    />
                  </label>
                  <button
                    className="plan-action-button plan-action-button--compact"
                    data-testid="record-task-verification-button"
                    disabled={saveBlocked}
                    onClick={() => submitDraft(entry, verification)}
                    type="button"
                  >
                    Save verification
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ValidationPanel({
  issues,
}: {
  readonly issues: readonly { readonly id: string; readonly path: string; readonly message: string }[];
}) {
  return (
    <div
      className={`plan-validation ${issues.length > 0 ? "plan-validation--blocked" : "plan-validation--passed"}`}
      data-testid="plan-validation-errors"
    >
      {issues.length > 0 ? (
        <>
          <strong>Approval blocked</strong>
          {issues.map((issue) => (
            <span key={issue.id}>
              {issue.path}: {issue.message}
            </span>
          ))}
        </>
      ) : (
        <strong>Validation passed</strong>
      )}
    </div>
  );
}

function PlanOutputCard({
  output,
  submitting,
  onReviewPlan,
}: {
  readonly output: GeneratedOutputRecord;
  readonly submitting: boolean;
  readonly onReviewPlan: (output: GeneratedOutputRecord, status: "accepted" | "rejected") => void;
}) {
  const proposal = parsePlanProposal(output.content);
  const issues = proposal ? validatePlanProposal(proposal) : [
    { id: "parse", path: output.title, message: "Plan proposal content is invalid." },
  ];
  const canAccept = output.status === "proposed" && issues.length === 0;
  return (
    <article className="plan-research-output">
      <div className="plan-research-output__header">
        <div>
          <h3>{output.title}</h3>
          <span>{formatOutputStatus(output.status)}</span>
        </div>
        {output.status === "draft" || output.status === "proposed" ? (
          <div className="plan-research-output__actions">
            <button
              className="plan-action-button plan-action-button--compact"
              disabled={!canAccept || submitting}
              onClick={() => onReviewPlan(output, "accepted")}
              type="button"
            >
              Accept plan
            </button>
            <button
              className="plan-secondary-button plan-secondary-button--compact"
              disabled={submitting}
              onClick={() => onReviewPlan(output, "rejected")}
              type="button"
            >
              Reject
            </button>
          </div>
        ) : null}
      </div>
      {proposal ? <PlanProposalPreview proposal={proposal} /> : <p>{output.content}</p>}
      {issues.length > 0 ? <ValidationPanel issues={issues} /> : null}
    </article>
  );
}

function PlanProposalPreview({ proposal }: { readonly proposal: PlanningPlanProposalDraft }) {
  return (
    <div className="plan-roadmap-preview">
      <p>{proposal.boundaryMap}</p>
      {proposal.milestones.map((milestone) => (
        <div className="plan-roadmap-preview__milestone" key={milestone.id}>
          <strong>
            {milestone.id}: {milestone.title}
          </strong>
          <span>{milestone.outcome}</span>
          {milestone.slices.map((slice) => (
            <span key={slice.id}>
              {slice.id}: {slice.title} · {slice.tasks.length} task{slice.tasks.length === 1 ? "" : "s"}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function ResearchOutputCard({
  output,
  children,
}: {
  readonly output: GeneratedOutputRecord;
  readonly children?: ReactNode;
}) {
  return (
    <article className="plan-research-output">
      <div className="plan-research-output__header">
        <div>
          <h3>{output.title}</h3>
          <span>{formatOutputStatus(output.status)}</span>
        </div>
        {children ? <div className="plan-research-output__actions">{children}</div> : null}
      </div>
      <p>{output.content}</p>
    </article>
  );
}

function buildResearchDraft(snapshot: PlanSnapshot | undefined, answers: readonly AnswerRecord[]): string {
  if (!snapshot) {
    return "";
  }
  const project = snapshot.project;
  const loadBearingAnswers = answers.filter((answer) => answer.loadBearing);
  const lines = [
    `Project: ${project.title ?? snapshot.name}`,
    "",
    "Research checks:",
    "- Confirm the affected code areas and current ownership boundaries.",
    "- Identify external systems, file formats, persistence paths, and migration risks.",
    "- Note validation evidence needed before PLAN approval.",
    "- Capture blockers, assumptions, and decisions that could change scope.",
    "",
    "Discuss memory:",
    ...loadBearingAnswers.map((answer) => `- ${answer.prompt}: ${answer.answer.replace(/\s+/g, " ").trim()}`),
  ];
  return lines.join("\n");
}

function emptyPlanProposal(): PlanningPlanProposalDraft {
  return {
    version: 1,
    boundaryMap: "",
    ideaPool: "",
    milestones: [],
  };
}

function getPlanTaskEntries(proposal: PlanningPlanProposalDraft): readonly PlanTaskEntry[] {
  return proposal.milestones.flatMap((milestone) =>
    milestone.slices.flatMap((slice) =>
      slice.tasks.map((task) => ({
        task,
        taskPath: `${milestone.id}/${slice.id}/${task.id}`,
        acceptance: task.acceptance,
      })),
    ),
  );
}

function formatOutputStatus(status: GeneratedOutputRecord["status"]): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "proposed":
      return "Proposed";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
  }
}

function formatStageStatus(status: StageStatus | undefined): string {
  return status ? `· ${formatResearchStatus(status, 0)}` : "";
}

function formatResearchStatus(status: StageStatus | undefined, outputCount: number): string {
  switch (status) {
    case "active":
      return outputCount > 0 ? "Needs more research" : "Active";
    case "needs-review":
      return "Needs review";
    case "approved":
      return "Approved";
    case "blocked":
      return "Blocked";
    case "not-started":
    case undefined:
      return outputCount > 0 ? "Staged" : "Queued";
    default:
      return status;
  }
}

function formatPlanStatus(status: StageStatus | undefined, outputCount: number): string {
  switch (status) {
    case "active":
      return outputCount > 0 ? "Needs edits" : "Active";
    case "needs-review":
      return "Needs review";
    case "approved":
      return "Approved";
    case "blocked":
      return "Blocked";
    case "not-started":
    case undefined:
      return outputCount > 0 ? "Staged" : "Queued";
    default:
      return status;
  }
}

function formatExecuteStatus(started: boolean, acceptedPlanCount: number): string {
  if (started) {
    return "Active";
  }
  return acceptedPlanCount > 0 ? "Ready" : "Queued";
}

function formatVerifyStatus(started: boolean, verificationCount: number): string {
  if (started) {
    return verificationCount > 0 ? `${verificationCount} checked` : "Active";
  }
  return "Queued";
}

function formatTaskExecutionStatus(status: TaskExecutionStatus): string {
  switch (status) {
    case "not-started":
      return "Not started";
    case "in-progress":
      return "In progress";
    case "blocked":
      return "Blocked";
    case "done":
      return "Done";
  }
}

function formatTaskVerificationStatus(status: TaskVerificationStatus | undefined): string {
  switch (status) {
    case "passed":
      return "Passed";
    case "failed":
      return "Failed";
    case undefined:
      return "Pending";
  }
}

function stageLabel(stage: PlanStage): string {
  switch (stage) {
    case "project":
      return "Project";
    case "requirements":
      return "Requirements";
    case "milestone":
      return "Milestone";
    case "research":
      return "Research";
    case "roadmap":
      return "Roadmap";
    case "slice-context":
      return "Slice context";
    case "task":
      return "Task";
  }
}

function parseLatestAcceptedPlanProposal(
  outputs: readonly GeneratedOutputRecord[],
): PlanningPlanProposalDraft | undefined {
  const output = [...outputs].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  return output ? parsePlanProposal(output.content) : undefined;
}
