import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import type { RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import type {
  AnswerRecord,
  ChangeProposalRecord,
  GeneratedOutputRecord,
  ParkedItemReviewStatus,
  ParkedItemRecord,
  PlanPhase,
  PlanSnapshot,
  PlanStage,
  RequirementRecord,
  ShipSummaryRecord,
  StageStatus,
  TaskExecutionRecord,
  TaskExecutionStatus,
  TaskSessionLinkRecord,
  TaskVerificationRecord,
  TaskVerificationStatus,
  WorkflowPhaseModelPreferences,
  WorkflowPreferencesRecord,
} from "@pi-gui/gsd-planning";
import type {
  ApplyPlanningWorkflowPreferencesInput,
  ApprovePlanningChangeProposalInput,
  ApprovePlanningTaskModificationInput,
  ConfirmPlanningStageInput,
  CreatePlanningPlanInput,
  DesktopAppState,
  DraftPlanningChangeProposalInput,
  GlobalPlanningPreferences,
  HidePlanningTaskInput,
  LinkPlanningTaskSessionInput,
  PlanningMilestoneDraft,
  PlanningPhaseDraft,
  PlanningPlanProposalDraft,
  PlanningProjectionSummary,
  PlanningSliceDraft,
  PlanningTaskDraft,
  ProposePlanningPlanInput,
  ProposePlanningResearchInput,
  RecordPlanningAnswerInput,
  RecordPlanningShipSummaryInput,
  RecordPlanningTaskVerificationInput,
  RegeneratePlanningProjectionsInput,
  UpsertPlanningRequirementsInput,
  ReviewPlanningIdeaInput,
  ReviewPlanningPlanInput,
  ReviewPlanningResearchInput,
  RevisePlanningAnswerInput,
  SelectPlanningPlanInput,
  StartPlanningExecutionInput,
  StartPlanningPlanInput,
  StartPlanningResearchInput,
  StartPlanningShipInput,
  StartPlanningVerifyInput,
  UpdatePlanningWorkflowPreferencesInput,
  UpdatePlanningTaskExecutionInput,
  WorkspacePlanningState,
  WorkspaceRecord,
  WorkspaceSessionTarget,
} from "./desktop-state";
import { buildModelOptions, type ComposerModelOption } from "./composer-commands";
import { ArrowUpIcon, PlanIcon } from "./icons";
import {
  buildAdaptiveFollowUpForAnswer,
  buildAdaptiveFollowUpForDraft,
  type AdaptiveFollowUp,
} from "./plan-builder-follow-ups";
import {
  buildPlanProposalDraft,
  nextPlanId,
  parsePlanProposal,
  splitDependencies,
  validatePlanProposal,
} from "./plan-builder-plan";
import { buildRequirementDrafts } from "./plan-builder-requirements";
import {
  promptSourceForDiscussStage,
  workflowPromptSources,
  type WorkflowPromptSource,
} from "./plan-builder-prompt-sources";
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
  type DiscussQuestion,
  type DiscussStage,
  type DiscussStageProgress,
} from "./plan-builder-discuss";
import {
  phaseModelPreferenceFromValue,
  phaseModelPreferenceToValue,
  planningPhaseModelOptions,
} from "./planning-phase-models";

const planPhases: readonly { readonly id: PlanPhase; readonly label: string }[] = [
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
  readonly runtime?: RuntimeSnapshot;
  readonly globalPlanningPreferences: GlobalPlanningPreferences;
  readonly planningState: WorkspacePlanningState | undefined;
  readonly lastError?: string;
  readonly onSelectWorkspace: (workspaceId: string) => void;
  readonly onCreatePlan: (input: CreatePlanningPlanInput) => Promise<DesktopAppState>;
  readonly onSelectPlan: (input: SelectPlanningPlanInput) => Promise<DesktopAppState>;
  readonly onApplyWorkflowPreferences: (input: ApplyPlanningWorkflowPreferencesInput) => Promise<DesktopAppState>;
  readonly onUpdateWorkflowPreferences: (input: UpdatePlanningWorkflowPreferencesInput) => Promise<DesktopAppState>;
  readonly onRecordAnswer: (input: RecordPlanningAnswerInput) => Promise<DesktopAppState>;
  readonly onReviseAnswer: (input: RevisePlanningAnswerInput) => Promise<DesktopAppState>;
  readonly onUpsertRequirements: (input: UpsertPlanningRequirementsInput) => Promise<DesktopAppState>;
  readonly onReviewIdea: (input: ReviewPlanningIdeaInput) => Promise<DesktopAppState>;
  readonly onDraftChangeProposal: (input: DraftPlanningChangeProposalInput) => Promise<DesktopAppState>;
  readonly onApproveChangeProposal: (input: ApprovePlanningChangeProposalInput) => Promise<DesktopAppState>;
  readonly onApproveTaskModification: (input: ApprovePlanningTaskModificationInput) => Promise<DesktopAppState>;
  readonly onHidePlanningTask: (input: HidePlanningTaskInput) => Promise<DesktopAppState>;
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
  readonly onStartShip: (input: StartPlanningShipInput) => Promise<DesktopAppState>;
  readonly onRecordShipSummary: (input: RecordPlanningShipSummaryInput) => Promise<DesktopAppState>;
  readonly onOpenTaskSession: (target: WorkspaceSessionTarget) => Promise<DesktopAppState>;
  readonly onRegenerateProjections: (input: RegeneratePlanningProjectionsInput) => Promise<DesktopAppState>;
}

interface GuidanceRollupItem {
  readonly stage: DiscussStage;
  readonly total: number;
  readonly high: number;
  readonly medium: number;
  readonly signals: readonly string[];
}

export function PlanBuilderView({
  workspaces,
  selectedWorkspaceId,
  runtime,
  globalPlanningPreferences,
  planningState,
  lastError,
  onSelectWorkspace,
  onCreatePlan,
  onSelectPlan,
  onApplyWorkflowPreferences,
  onUpdateWorkflowPreferences,
  onRecordAnswer,
  onReviseAnswer,
  onUpsertRequirements,
  onReviewIdea,
  onDraftChangeProposal,
  onApproveChangeProposal,
  onApproveTaskModification,
  onHidePlanningTask,
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
  onStartShip,
  onRecordShipSummary,
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
  const [draftingIdeaId, setDraftingIdeaId] = useState("");
  const [changeProposalTitleDraft, setChangeProposalTitleDraft] = useState("");
  const [changeProposalSummaryDraft, setChangeProposalSummaryDraft] = useState("");
  const [changeProposalImpactDraft, setChangeProposalImpactDraft] = useState("");
  const [researchReadinessAcknowledged, setResearchReadinessAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
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
  const requirementDrafts = useMemo(() => buildRequirementDrafts(snapshot), [snapshot]);
  const savedRequirements = snapshot?.requirements ?? [];
  const requirementRows = savedRequirements.length > 0 ? savedRequirements : requirementDrafts;
  const activeFollowUp = useMemo(
    () => buildAdaptiveFollowUpForDraft(activeQuestion, answerDraft, { requirements: requirementRows }),
    [activeQuestion, answerDraft, requirementRows],
  );
  const followUpsByAnswerId = useMemo(() => {
    const next = new Map<string, AdaptiveFollowUp>();
    for (const answer of latestAnswers) {
      const followUp = buildAdaptiveFollowUpForAnswer(answer, { requirements: requirementRows });
      if (followUp) {
        next.set(answer.id, followUp);
      }
    }
    return next;
  }, [latestAnswers, requirementRows]);
  const guidanceRollup = useMemo(
    () => buildGuidanceRollup(latestAnswers, followUpsByAnswerId),
    [followUpsByAnswerId, latestAnswers],
  );
  const readinessSignature = guidanceRollup
    .map((item) => `${item.stage}:${item.high}:${item.medium}:${item.total}`)
    .join("|");
  const researchReadinessRequiresOverride = guidanceRollup.some((item) => item.high > 0);
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
  const shipStarted = snapshot?.activePhase === "ship";
  const planStarted = Boolean(snapshot && (snapshot.activePhase === "plan" || roadmapStage || planOutputs.length > 0));
  const planDraft = useMemo(
    () => buildPlanProposalDraft(snapshot, latestAnswers, acceptedResearchOutputs),
    [acceptedResearchOutputs, latestAnswers, snapshot],
  );
  const planValidationIssues = useMemo(() => validatePlanProposal(planProposal), [planProposal]);
  const changeProposalsBySource = useMemo(
    () => new Map((snapshot?.changeProposals ?? []).map((proposal) => [proposal.sourceParkedItemId, proposal])),
    [snapshot],
  );
  const modelOptions = useMemo(() => buildModelOptions(runtime), [runtime]);
  const answerActionDisabled = !activeQuestion || !answerDraft.trim() || submitting;

  useEffect(() => {
    const existingAnswer = activeQuestion ? latestAnswersByQuestion.get(activeQuestion.id) : undefined;
    setAnswerDraft(existingAnswer?.loadBearing ? existingAnswer.answer : "");
  }, [activeQuestion?.id, latestAnswersByQuestion, snapshot?.id]);

  useEffect(() => {
    composerTextareaRef.current?.focus();
  }, [activeQuestion?.id]);

  useEffect(() => {
    setEditingAnswerId("");
    setRevisionDraft("");
    setDraftingIdeaId("");
    setChangeProposalTitleDraft("");
    setChangeProposalSummaryDraft("");
    setChangeProposalImpactDraft("");
  }, [snapshot?.id]);

  useEffect(() => {
    setResearchReadinessAcknowledged(false);
  }, [readinessSignature, snapshot?.id]);

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

  const applyWorkflowPreferences = () => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onApplyWorkflowPreferences({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const updateWorkflowPhaseOverrides = (phaseOverrides: WorkflowPhaseModelPreferences) => {
    if (!snapshot?.workflowPreferences || submitting) {
      return;
    }
    setSubmitting(true);
    void onUpdateWorkflowPreferences({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      preferences: buildWorkflowPreferenceUpdate(snapshot.workflowPreferences, phaseOverrides),
    }).finally(() => {
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
    })
      .then(() => {
        if (!loadBearing) {
          setAnswerDraft("");
        }
        requestAnimationFrame(() => {
          composerTextareaRef.current?.focus();
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const submitComposerFromKeyboard = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || (!event.metaKey && !event.ctrlKey)) {
      return;
    }
    event.preventDefault();
    recordAnswer(true);
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

  const startAnswerRevision = (answer: AnswerRecord) => {
    setEditingAnswerId(answer.id);
    setRevisionDraft(answer.answer);
  };

  const saveRequirementsContract = () => {
    if (!snapshot || requirementDrafts.length === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    void onUpsertRequirements({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      requirements: requirementDrafts,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const reviewIdea = (itemId: string, status: ParkedItemReviewStatus) => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onReviewIdea({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      itemId,
      status,
      note: reviewIdeaNote(status),
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const startDraftChangeProposal = (item: ParkedItemRecord) => {
    if (submitting || changeProposalsBySource.has(item.id)) {
      return;
    }
    setDraftingIdeaId(item.id);
    setChangeProposalTitleDraft(buildChangeProposalTitle(item));
    setChangeProposalSummaryDraft(item.text);
    setChangeProposalImpactDraft(buildChangeProposalImpactDraft(item));
  };

  const cancelDraftChangeProposal = () => {
    setDraftingIdeaId("");
    setChangeProposalTitleDraft("");
    setChangeProposalSummaryDraft("");
    setChangeProposalImpactDraft("");
  };

  const draftChangeProposal = (item: ParkedItemRecord) => {
    if (!snapshot || submitting) {
      return;
    }
    const title = changeProposalTitleDraft.trim();
    const summary = changeProposalSummaryDraft.trim();
    const impactNotes = changeProposalImpactDraft.trim();
    if (!title || !summary || !impactNotes) {
      return;
    }
    setSubmitting(true);
    void onDraftChangeProposal({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      sourceParkedItemId: item.id,
      title,
      summary,
      impactNotes,
    })
      .then(() => {
        cancelDraftChangeProposal();
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const approveChangeProposal = (proposal: ChangeProposalRecord, draft: PlanInjectionApprovalDraft) => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onApproveChangeProposal({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      proposalId: proposal.id,
      targetMilestoneId: draft.targetMilestoneId,
      targetSliceId: draft.targetSliceId,
      taskId: draft.taskId,
      taskTitle: draft.taskTitle,
      taskAcceptance: draft.taskAcceptance,
      dependencies: splitDependencies(draft.dependencies),
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const approveTaskModification = (proposal: ChangeProposalRecord, draft: PlanTaskModificationDraft) => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onApproveTaskModification({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      proposalId: proposal.id,
      taskPath: draft.taskPath,
      taskTitle: draft.taskTitle,
      taskAcceptance: draft.taskAcceptance,
      dependencies: splitDependencies(draft.dependencies),
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const hidePlanningTask = (taskPath: string, reason: string) => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onHidePlanningTask({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      taskPath,
      reason,
    }).finally(() => {
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

  const startShip = () => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onStartShip({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
    }).finally(() => {
      setSubmitting(false);
    });
  };

  const recordShipSummary = (summary: string) => {
    if (!snapshot || submitting) {
      return;
    }
    setSubmitting(true);
    void onRecordShipSummary({
      workspaceId: workspace.id,
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      summary,
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

  const updatePhase = (phaseIndex: number, patch: Partial<PlanningPhaseDraft>) => {
    setPlanProposal((current) => ({
      ...current,
      phases: current.phases.map((phase, index) => (index === phaseIndex ? { ...phase, ...patch } : phase)),
    }));
  };

  const addPhase = () => {
    setPlanProposal((current) => {
      const phaseId = nextPlanId("P", current.phases.map((phase) => phase.id));
      return {
        ...current,
        phases: [
          ...current.phases,
          {
            id: phaseId,
            title: "New phase",
            goal: "Define this phase goal.",
          },
        ],
      };
    });
  };

  const removePhase = (phaseIndex: number) => {
    setPlanProposal((current) => {
      if (current.phases.length <= 1) {
        return current;
      }
      const removedPhase = current.phases[phaseIndex];
      const phases = current.phases.filter((_phase, index) => index !== phaseIndex);
      const fallbackPhaseId = phases[0]?.id ?? "";
      return {
        ...current,
        phases,
        milestones: current.milestones.map((milestone) =>
          milestone.phase === removedPhase?.id ? { ...milestone, phase: fallbackPhaseId } : milestone,
        ),
      };
    });
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
            phase: current.phases[0]?.id ?? "P1",
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
    : shipStarted
      ? "SHIP gate is active; prepare the final handoff summary"
      : verifyStarted
      ? "VERIFY gate is active; check completed tasks against acceptance"
      : executeStarted
      ? "EXECUTE queue is active; create or open linked task sessions"
    : acceptedPlanOutputs.length > 0
      ? "Start EXECUTE when the accepted plan is ready for task work"
    : planStarted
      ? "Structured plan proposals are validated before approval"
    : acceptedResearchOutputs.length > 0
      ? "Start PLAN when you are ready to structure the roadmap"
    : researchStarted
      ? "Reviewable research is persisted in the planning database"
      : allDiscussConfirmed
        ? "Start research when you are ready to stage findings"
        : snapshot
          ? "DISCUSS memory is persisted in the planning database"
          : "Start with the project outcome, constraints, and users";
  const composerPhaseAction = !activeQuestion && snapshot && allDiscussConfirmed
    ? !researchStarted
      ? {
          ariaLabel: "Advance composer to RESEARCH",
          disabled: submitting || (researchReadinessRequiresOverride && !researchReadinessAcknowledged),
          run: startResearch,
        }
      : acceptedResearchOutputs.length > 0 && !planStarted
        ? {
            ariaLabel: "Advance composer to PLAN",
            disabled: submitting,
            run: startPlan,
          }
        : planStarted && acceptedPlanOutputs.length > 0 && !executeStarted && !verifyStarted && !shipStarted
          ? {
              ariaLabel: "Advance composer to EXECUTE",
              disabled: submitting,
              run: startExecution,
            }
        : undefined
    : undefined;
  const composerSubmitDisabled = activeQuestion ? answerActionDisabled : !composerPhaseAction || composerPhaseAction.disabled;
  const submitComposerAction = () => {
    if (activeQuestion) {
      recordAnswer(true);
      return;
    }
    composerPhaseAction?.run();
  };
  const workflowGuidance = buildWorkflowGuidance({
    activeQuestion,
    acceptedResearchCount: acceptedResearchOutputs.length,
    allDiscussConfirmed,
    currentProgress,
    executeStarted,
    planStarted,
    researchStarted,
    shipStarted,
    snapshot,
    verifyStarted,
  });

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

            <WorkflowGuidanceCard guidance={workflowGuidance} />

            {snapshot ? (
              <WorkflowPreferencesCard
                preferences={snapshot.workflowPreferences}
                globalPlanningPreferences={globalPlanningPreferences}
                modelOptions={modelOptions}
                submitting={submitting}
                onApply={applyWorkflowPreferences}
                onUpdatePhaseOverrides={updateWorkflowPhaseOverrides}
              />
            ) : null}

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
                {guidanceRollup.length > 0 ? (
                  <ReadinessWarning
                    acknowledged={researchReadinessAcknowledged}
                    items={guidanceRollup}
                    requiresAcknowledgement={researchReadinessRequiresOverride}
                    onAcknowledgementChange={setResearchReadinessAcknowledged}
                  />
                ) : null}
                <button
                  className="plan-action-button"
                  disabled={submitting || (researchReadinessRequiresOverride && !researchReadinessAcknowledged)}
                  onClick={startResearch}
                  type="button"
                >
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
                {guidanceRollup.length > 0 ? <ReadinessWarning items={guidanceRollup} /> : null}
                <button className="plan-action-button" disabled={submitting} onClick={startPlan} type="button">
                  Start plan
                </button>
              </div>
            ) : allDiscussConfirmed && shipStarted ? (
              <PlanShipGate
                acceptedPlanProposal={acceptedPlanProposal}
                shipSummaries={snapshot.shipSummaries ?? []}
                submitting={submitting}
                taskExecutions={snapshot.taskExecutions ?? []}
                taskVerifications={snapshot.taskVerifications ?? []}
                onRecordShipSummary={recordShipSummary}
              />
            ) : allDiscussConfirmed && verifyStarted ? (
              <PlanVerifyGate
                acceptedPlanProposal={acceptedPlanProposal}
                submitting={submitting}
                taskExecutions={snapshot.taskExecutions ?? []}
                taskVerifications={snapshot.taskVerifications ?? []}
                onRecordTaskVerification={recordTaskVerification}
                onStartShip={startShip}
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
                onAddPhase={addPhase}
                onAddSlice={addSlice}
                onAddTask={addTask}
                onBoundaryMapChange={(value) => setPlanProposal((current) => ({ ...current, boundaryMap: value }))}
                onIdeaPoolChange={(value) => setPlanProposal((current) => ({ ...current, ideaPool: value }))}
                onProposePlan={proposePlan}
                onRegenerateProjections={regenerateProjections}
                onStartExecution={startExecution}
                onRemoveMilestone={removeMilestone}
                onRemovePhase={removePhase}
                onRemoveSlice={removeSlice}
                onRemoveTask={removeTask}
                onReviewPlan={reviewPlan}
                onUpdateMilestone={updateMilestone}
                onUpdatePhase={updatePhase}
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
                {activeFollowUp ? <AdaptiveFollowUpCard followUp={activeFollowUp} /> : null}
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

          <form
            className="plan-composer"
            aria-label="Plan prompt composer"
            onSubmit={(event) => {
              event.preventDefault();
              submitComposerAction();
            }}
          >
            <div className={`plan-composer__field ${activeQuestion ? "plan-composer__field--active" : ""}`}>
              {activeQuestion ? (
                <>
                  <div className="plan-composer__question" data-testid="plan-composer-question">
                    {activeQuestion.prompt}
                  </div>
                  <textarea
                    aria-label="Answer current planning question"
                    data-testid="plan-composer-textarea"
                    onChange={(event) => setAnswerDraft(event.target.value)}
                    onKeyDown={submitComposerFromKeyboard}
                    placeholder="Answer with the context future planning decisions should remember."
                    ref={composerTextareaRef}
                    value={answerDraft}
                  />
                </>
              ) : (
                <span>{composerStatus}</span>
              )}
            </div>
            {activeQuestion ? (
              <button
                className="plan-composer__park"
                type="button"
                disabled={answerActionDisabled}
                aria-label="Move composer draft to idea pool"
                onClick={() => recordAnswer(false)}
              >
                Park
              </button>
            ) : null}
            <button
              className="plan-composer__send"
              type="submit"
              disabled={composerSubmitDisabled}
              aria-label={activeQuestion ? "Submit composer answer" : (composerPhaseAction?.ariaLabel ?? "Plan composer action")}
            >
              <ArrowUpIcon />
            </button>
          </form>
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
              <div className={`plan-stage-list__item ${shipStarted ? "plan-stage-list__item--active" : ""}`}>
                <span>Ship</span>
                <small>{formatShipStatus(shipStarted, snapshot?.shipSummaries?.length ?? 0)}</small>
              </div>
            </div>

            {guidanceRollup.length > 0 ? <GuidanceRollupCard items={guidanceRollup} /> : null}

            {latestAnswers.length > 0 ? (
              <div className="plan-memory" data-testid="plan-answer-history">
                <div className="plan-memory__title">Discussion memory</div>
                {latestAnswers.map((answer) => {
                  const question = getDiscussQuestion(answer.questionId);
                  const prompt = answer.prompt || question?.prompt;
                  const isEditing = editingAnswerId === answer.id;
                  const followUp = followUpsByAnswerId.get(answer.id);
                  return (
                    <article className="plan-memory__item" key={answer.id}>
                      <div className="plan-memory__item-header">
                        <span>{question?.label ?? answer.questionId}</span>
                        <button
                          className="plan-inline-button"
                          onClick={() => startAnswerRevision(answer)}
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                      {prompt ? (
                        <p className="plan-memory__question" data-testid="plan-memory-question">
                          {prompt}
                        </p>
                      ) : null}
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
                      {followUp ? (
                        <AdaptiveFollowUpCard
                          actionLabel="Edit answer"
                          followUp={followUp}
                          compact
                          onAction={() => startAnswerRevision(answer)}
                        />
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}

            {requirementRows.length > 0 ? (
              <RequirementsContractCard
                draftCount={requirementDrafts.length}
                requirements={requirementRows}
                saved={savedRequirements.length > 0}
                submitting={submitting}
                onSave={saveRequirementsContract}
              />
            ) : null}

            {snapshot?.parkedItems?.length ? (
              <div className="plan-memory" data-testid="plan-idea-pool">
                <div className="plan-memory__title">Idea pool</div>
                {snapshot.parkedItems.map((item) => {
                  const question = getDiscussQuestion(item.sourceQuestionId);
                  const proposal = changeProposalsBySource.get(item.id);
                  const isDraftingProposal = draftingIdeaId === item.id;
                  return (
                    <article
                      className="plan-memory__item plan-memory__item--parked"
                      data-testid="plan-idea-item"
                      key={item.id}
                    >
                      <div className="plan-memory__item-header">
                        <span>{question?.label ?? item.sourceQuestionId}</span>
                        <small data-testid="plan-idea-status">{formatIdeaReviewStatus(item.reviewStatus)}</small>
                      </div>
                      <p>{item.text}</p>
                      {item.reviewNote ? <p className="plan-memory__note">{item.reviewNote}</p> : null}
                      <div className="plan-idea-actions">
                        <button
                          className="plan-inline-button"
                          disabled={submitting || item.reviewStatus === "kept"}
                          onClick={() => reviewIdea(item.id, "kept")}
                          type="button"
                        >
                          Keep
                        </button>
                        <button
                          className="plan-inline-button"
                          disabled={submitting || item.reviewStatus === "promotion-ready"}
                          onClick={() => reviewIdea(item.id, "promotion-ready")}
                          type="button"
                        >
                          Prepare
                        </button>
                        <button
                          className="plan-inline-button"
                          disabled={submitting || item.reviewStatus === "dismissed"}
                          onClick={() => reviewIdea(item.id, "dismissed")}
                          type="button"
                        >
                          Dismiss
                        </button>
                        {item.reviewStatus === "promotion-ready" ? (
                          <button
                            className="plan-inline-button"
                            disabled={submitting || Boolean(proposal)}
                            onClick={() => startDraftChangeProposal(item)}
                            type="button"
                          >
                            {proposal ? "Drafted" : "Draft change"}
                          </button>
                        ) : null}
                      </div>
                      {isDraftingProposal ? (
                        <div className="plan-change-draft" data-testid="plan-change-draft-form">
                          <label>
                            <span>Title</span>
                            <input
                              data-testid="plan-change-title-input"
                              onChange={(event) => setChangeProposalTitleDraft(event.target.value)}
                              value={changeProposalTitleDraft}
                            />
                          </label>
                          <label>
                            <span>Summary</span>
                            <textarea
                              data-testid="plan-change-summary-textarea"
                              onChange={(event) => setChangeProposalSummaryDraft(event.target.value)}
                              value={changeProposalSummaryDraft}
                            />
                          </label>
                          <label>
                            <span>Impact notes</span>
                            <textarea
                              data-testid="plan-change-impact-textarea"
                              onChange={(event) => setChangeProposalImpactDraft(event.target.value)}
                              value={changeProposalImpactDraft}
                            />
                          </label>
                          <div className="plan-memory__editor-actions">
                            <button
                              className="plan-action-button plan-action-button--compact"
                              disabled={
                                submitting ||
                                !changeProposalTitleDraft.trim() ||
                                !changeProposalSummaryDraft.trim() ||
                                !changeProposalImpactDraft.trim()
                              }
                              onClick={() => draftChangeProposal(item)}
                              type="button"
                            >
                              Save draft
                            </button>
                            <button
                              className="plan-secondary-button plan-secondary-button--compact"
                              onClick={cancelDraftChangeProposal}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}

            {snapshot?.changeProposals?.length ? (
              <div className="plan-memory" data-testid="plan-change-proposals">
                <div className="plan-memory__title">Change proposals</div>
                {snapshot.changeProposals.map((proposal) => (
                  <ChangeProposalCard
                    acceptedPlanProposal={acceptedPlanProposal}
                    key={proposal.id}
                    proposal={proposal}
                    submitting={submitting}
                    onApprove={approveChangeProposal}
                    onApproveModification={approveTaskModification}
                    onHideTask={hidePlanningTask}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

function AdaptiveFollowUpCard({
  actionLabel,
  compact = false,
  followUp,
  onAction,
}: {
  readonly actionLabel?: string;
  readonly compact?: boolean;
  readonly followUp: AdaptiveFollowUp;
  readonly onAction?: () => void;
}) {
  return (
    <div
      className={`plan-follow-up ${compact ? "plan-follow-up--compact" : ""}`}
      data-testid="adaptive-follow-up"
    >
      <div className="plan-follow-up__header">
        <span>Suggested follow-up</span>
        <strong data-testid="adaptive-follow-up-severity">
          {followUp.severity === "high" ? "High signal" : "Medium signal"}
        </strong>
      </div>
      <p data-testid="adaptive-follow-up-question">{followUp.question}</p>
      <div className="plan-follow-up__signals" data-testid="adaptive-follow-up-signals">
        {followUp.signals.map((signal) => (
          <span key={signal}>{signal}</span>
        ))}
      </div>
      <small data-testid="adaptive-follow-up-rationale">{followUp.rationale}</small>
      {actionLabel && onAction ? (
        <div className="plan-follow-up__actions">
          <button
            className="plan-inline-button plan-follow-up__action"
            data-testid="adaptive-follow-up-action"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function GuidanceRollupCard({ items }: { readonly items: readonly GuidanceRollupItem[] }) {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const high = items.reduce((sum, item) => sum + item.high, 0);
  return (
    <div className="plan-memory plan-guidance-rollup" data-testid="adaptive-guidance-rollup">
      <div className="plan-memory__title">Guidance rollup</div>
      <article className="plan-memory__item" data-testid="adaptive-guidance-rollup-summary">
        <div className="plan-memory__item-header">
          <span>DISCUSS readiness</span>
          <small>{total} unresolved</small>
        </div>
        <p>
          {high > 0
            ? `${high} high-signal answer${high === 1 ? "" : "s"} should be revised before later phases trust them.`
            : "Medium-signal answers should be tightened before later phases trust them."}
        </p>
      </article>
      {items.map((item) => (
        <article
          className="plan-memory__item plan-guidance-rollup__item"
          data-testid="adaptive-guidance-rollup-item"
          key={item.stage}
        >
          <div className="plan-memory__item-header">
            <span data-testid="adaptive-guidance-rollup-stage">DISCUSS / {stageLabel(item.stage)}</span>
            <small data-testid="adaptive-guidance-rollup-count">{formatGuidanceRollupCount(item)}</small>
          </div>
          <p>
            {item.total} answer{item.total === 1 ? "" : "s"} need{item.total === 1 ? "s" : ""} revision before moving
            forward.
          </p>
          <div className="plan-follow-up__signals" data-testid="adaptive-guidance-rollup-signals">
            {item.signals.map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function ReadinessWarning({
  acknowledged = false,
  items,
  requiresAcknowledgement = false,
  onAcknowledgementChange,
}: {
  readonly acknowledged?: boolean;
  readonly items: readonly GuidanceRollupItem[];
  readonly requiresAcknowledgement?: boolean;
  readonly onAcknowledgementChange?: (acknowledged: boolean) => void;
}) {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const high = items.reduce((sum, item) => sum + item.high, 0);
  return (
    <div className="plan-readiness-warning" data-testid="plan-readiness-warning">
      <strong>{total} unresolved guidance item{total === 1 ? "" : "s"}</strong>
      <p>
        {high > 0
          ? "High-signal answers should be revised before later phases rely on them."
          : "Review or revise weak DISCUSS answers before later phases rely on them."}
      </p>
      <div className="plan-follow-up__signals" data-testid="plan-readiness-warning-stages">
        {items.map((item) => (
          <span key={item.stage}>DISCUSS / {stageLabel(item.stage)}</span>
        ))}
      </div>
      {requiresAcknowledgement && onAcknowledgementChange ? (
        <label className="plan-readiness-warning__ack">
          <input
            checked={acknowledged}
            data-testid="plan-readiness-override-checkbox"
            onChange={(event) => onAcknowledgementChange(event.target.checked)}
            type="checkbox"
          />
          <span>Continue to RESEARCH with unresolved high-signal guidance</span>
        </label>
      ) : null}
    </div>
  );
}

function RequirementsContractCard({
  draftCount,
  requirements,
  saved,
  submitting,
  onSave,
}: {
  readonly draftCount: number;
  readonly requirements: readonly RequirementRecord[];
  readonly saved: boolean;
  readonly submitting: boolean;
  readonly onSave: () => void;
}) {
  return (
    <div className="plan-memory" data-testid="requirements-contract">
      <div className="plan-requirements-contract__header">
        <div>
          <div className="plan-memory__title">Requirements contract</div>
          <p>{saved ? "Requirements contract saved" : "Drafted from requirements answers"}</p>
        </div>
        <button
          className="plan-inline-button"
          data-testid="save-requirements-contract-button"
          disabled={draftCount === 0 || submitting}
          onClick={onSave}
          type="button"
        >
          {saved ? "Update" : "Save"}
        </button>
      </div>
      {requirements.map((requirement) => (
        <article className="plan-memory__item plan-requirement-row" data-testid="requirement-row" key={requirement.id}>
          <div className="plan-memory__item-header">
            <span>
              {requirement.id}: {requirement.title}
            </span>
            <small>{formatRequirementValidationStatus(requirement.validationStatus)}</small>
          </div>
          <div className="plan-requirement-row__meta">
            <span>{formatRequirementClass(requirement.class)}</span>
            <span>{formatRequirementStatus(requirement.status)}</span>
            <span>{formatRequirementSource(requirement.source)}</span>
            <span>{requirement.owner}</span>
          </div>
          <p>{requirement.description}</p>
          <p className="plan-memory__note">{requirement.why}</p>
        </article>
      ))}
    </div>
  );
}

function buildGuidanceRollup(
  answers: readonly AnswerRecord[],
  followUpsByAnswerId: ReadonlyMap<string, AdaptiveFollowUp>,
): readonly GuidanceRollupItem[] {
  const rollupByStage = new Map<
    DiscussStage,
    {
      high: number;
      medium: number;
      signals: Set<string>;
      total: number;
    }
  >();

  for (const answer of answers) {
    if (!isDiscussStage(answer.stage)) {
      continue;
    }
    const followUp = followUpsByAnswerId.get(answer.id);
    if (!followUp) {
      continue;
    }
    const current =
      rollupByStage.get(answer.stage) ??
      {
        high: 0,
        medium: 0,
        signals: new Set<string>(),
        total: 0,
      };
    current.total += 1;
    if (followUp.severity === "high") {
      current.high += 1;
    } else {
      current.medium += 1;
    }
    for (const signal of followUp.signals) {
      current.signals.add(signal);
    }
    rollupByStage.set(answer.stage, current);
  }

  return discussStageOrder.flatMap((stage) => {
    const item = rollupByStage.get(stage);
    if (!item) {
      return [];
    }
    return [
      {
        stage,
        total: item.total,
        high: item.high,
        medium: item.medium,
        signals: [...item.signals].slice(0, 4),
      },
    ];
  });
}

function formatGuidanceRollupCount(item: GuidanceRollupItem): string {
  const parts = [];
  if (item.high > 0) {
    parts.push(`${item.high} high`);
  }
  if (item.medium > 0) {
    parts.push(`${item.medium} medium`);
  }
  return parts.join(" / ");
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
  onAddPhase,
  onAddSlice,
  onAddTask,
  onBoundaryMapChange,
  onIdeaPoolChange,
  onProposePlan,
  onRegenerateProjections,
  onStartExecution,
  onRemoveMilestone,
  onRemovePhase,
  onRemoveSlice,
  onRemoveTask,
  onReviewPlan,
  onUpdateMilestone,
  onUpdatePhase,
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
  readonly onAddPhase: () => void;
  readonly onAddSlice: (milestoneIndex: number) => void;
  readonly onAddTask: (milestoneIndex: number, sliceIndex: number) => void;
  readonly onBoundaryMapChange: (value: string) => void;
  readonly onIdeaPoolChange: (value: string) => void;
  readonly onProposePlan: (event: FormEvent<HTMLFormElement>) => void;
  readonly onRegenerateProjections: () => void;
  readonly onStartExecution: () => void;
  readonly onRemoveMilestone: (milestoneIndex: number) => void;
  readonly onRemovePhase: (phaseIndex: number) => void;
  readonly onRemoveSlice: (milestoneIndex: number, sliceIndex: number) => void;
  readonly onRemoveTask: (milestoneIndex: number, sliceIndex: number, taskIndex: number) => void;
  readonly onReviewPlan: (output: GeneratedOutputRecord, status: "accepted" | "rejected") => void;
  readonly onUpdateMilestone: (milestoneIndex: number, patch: Partial<PlanningMilestoneDraft>) => void;
  readonly onUpdatePhase: (phaseIndex: number, patch: Partial<PlanningPhaseDraft>) => void;
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
        <p>Structure phases, milestones, slices, tasks, dependencies, and boundaries before approval.</p>
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

        <section className="plan-roadmap-list" data-testid="plan-phase-editor">
          <div className="plan-roadmap-card">
            <div className="plan-roadmap-card__header">
              <span>Phases</span>
              <button
                className="plan-inline-button"
                data-testid="add-plan-phase-button"
                onClick={onAddPhase}
                type="button"
              >
                Add phase
              </button>
            </div>
            {planProposal.phases.map((phase, phaseIndex) => (
              <div className="plan-roadmap-nested" data-testid="plan-phase-row" key={`${phase.id}-${phaseIndex}`}>
                <div className="plan-roadmap-card__header">
                  <span>{phase.id || `P${phaseIndex + 1}`}</span>
                  <button
                    className="plan-inline-button"
                    data-testid="delete-plan-phase-button"
                    disabled={planProposal.phases.length <= 1}
                    onClick={() => onRemovePhase(phaseIndex)}
                    type="button"
                  >
                    Delete phase
                  </button>
                </div>
                <div className="plan-roadmap-grid">
                  <label className="plan-roadmap-form__field">
                    <span>Phase ID</span>
                    <input
                      data-testid="plan-phase-id-input"
                      onChange={(event) => onUpdatePhase(phaseIndex, { id: event.target.value })}
                      value={phase.id}
                    />
                  </label>
                  <label className="plan-roadmap-form__field">
                    <span>Phase title</span>
                    <input
                      data-testid="plan-phase-title-input"
                      onChange={(event) => onUpdatePhase(phaseIndex, { title: event.target.value })}
                      value={phase.title}
                    />
                  </label>
                </div>
                <label className="plan-roadmap-form__field">
                  <span>Phase goal</span>
                  <textarea
                    data-testid="plan-phase-goal-textarea"
                    onChange={(event) => onUpdatePhase(phaseIndex, { goal: event.target.value })}
                    value={phase.goal}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

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
                  <select
                    data-testid={milestoneIndex === 0 ? "plan-milestone-phase-select" : undefined}
                    onChange={(event) => onUpdateMilestone(milestoneIndex, { phase: event.target.value })}
                    value={milestone.phase}
                  >
                    {planProposal.phases.some((phase) => phase.id === milestone.phase) || !milestone.phase ? null : (
                      <option value={milestone.phase}>Unknown: {milestone.phase}</option>
                    )}
                    {planProposal.phases.map((phase) => (
                      <option key={`${phase.id}-${phase.title}`} value={phase.id}>
                        {phase.id}: {phase.title}
                      </option>
                    ))}
                  </select>
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

interface PlanInjectionApprovalDraft {
  readonly targetMilestoneId: string;
  readonly targetSliceId: string;
  readonly taskId: string;
  readonly taskTitle: string;
  readonly taskAcceptance: string;
  readonly dependencies: string;
}

interface PlanTaskModificationDraft {
  readonly taskPath: string;
  readonly taskTitle: string;
  readonly taskAcceptance: string;
  readonly dependencies: string;
}

interface PlanSliceTarget {
  readonly id: string;
  readonly label: string;
  readonly milestoneId: string;
  readonly sliceId: string;
}

interface WorkflowGuidance {
  readonly banner: string;
  readonly title: string;
  readonly nextAction: string;
  readonly artifact: string;
  readonly frame: string;
  readonly promptSource: WorkflowPromptSource;
}

function buildWorkflowGuidance({
  activeQuestion,
  acceptedResearchCount,
  allDiscussConfirmed,
  currentProgress,
  executeStarted,
  planStarted,
  researchStarted,
  shipStarted,
  snapshot,
  verifyStarted,
}: {
  readonly activeQuestion: DiscussQuestion | undefined;
  readonly acceptedResearchCount: number;
  readonly allDiscussConfirmed: boolean;
  readonly currentProgress: DiscussStageProgress | undefined;
  readonly executeStarted: boolean;
  readonly planStarted: boolean;
  readonly researchStarted: boolean;
  readonly shipStarted: boolean;
  readonly snapshot: PlanSnapshot | undefined;
  readonly verifyStarted: boolean;
}): WorkflowGuidance {
  if (!snapshot) {
    return {
      banner: "QUESTIONING / project",
      title: "Open with the user's language",
      nextAction: "Create a plan, then capture the project outcome, users, anti-goals, and constraints.",
      artifact: ".gsd/PROJECT.md",
      frame: "Project discussion",
      promptSource: workflowPromptSources.discussProject,
    };
  }

  if (shipStarted) {
    return {
      banner: "SHIP",
      title: "Prepare the handoff",
      nextAction: "Summarize what shipped, the verification evidence, and any follow-up the next session needs.",
      artifact: "Ship summary",
      frame: "Closeout",
      promptSource: workflowPromptSources.shipCloseout,
    };
  }

  if (verifyStarted) {
    return {
      banner: "VERIFY",
      title: "Check acceptance against evidence",
      nextAction: "Record pass or fail for each completed task using the acceptance text from the accepted plan.",
      artifact: "Task verification",
      frame: "UAT and verification",
      promptSource: workflowPromptSources.verifyUat,
    };
  }

  if (executeStarted) {
    return {
      banner: "EXECUTE",
      title: "Work through linked task sessions",
      nextAction: "Create or open each task session, then save status, blockers, notes, and evidence before VERIFY.",
      artifact: "Task execution state",
      frame: "Task execution",
      promptSource: workflowPromptSources.executeTask,
    };
  }

  if (planStarted) {
    return {
      banner: "PLAN",
      title: "Make the work executable",
      nextAction: "Shape milestones, slices, tasks, dependencies, and boundary notes before accepting the plan.",
      artifact: ".gsd/milestones/*",
      frame: "Milestone and slice plan",
      promptSource: workflowPromptSources.planRoadmap,
    };
  }

  if (acceptedResearchCount > 0) {
    return {
      banner: "PLAN",
      title: "Turn findings into structure",
      nextAction: "Start PLAN and convert accepted research into milestones, slices, tasks, dependencies, and boundaries.",
      artifact: ".gsd/milestones/*",
      frame: "Milestone and slice plan",
      promptSource: workflowPromptSources.planRoadmap,
    };
  }

  if (researchStarted) {
    return {
      banner: "RESEARCH",
      title: "Stage findings for review",
      nextAction: "Capture findings that change planning decisions, then accept only the research the plan should trust.",
      artifact: "Research output",
      frame: "Project research",
      promptSource: workflowPromptSources.researchProject,
    };
  }

  if (allDiscussConfirmed) {
    return {
      banner: "RESEARCH DECISION",
      title: "Choose the research path",
      nextAction: "Start RESEARCH when findings are useful, or keep the deterministic skip decision from preferences.",
      artifact: ".gsd/runtime/research-decision.json",
      frame: "Research decision",
      promptSource: workflowPromptSources.researchDecision,
    };
  }

  if (activeQuestion) {
    return guidanceForQuestion(activeQuestion);
  }

  if (currentProgress?.readyForReview && !currentProgress.depthConfirmed) {
    return {
      banner: `DEPTH CHECK / ${stageLabel(currentProgress.stage).toLowerCase()}`,
      title: "Confirm the stage has enough signal",
      nextAction: `${currentProgress.answered}/${currentProgress.total} load-bearing answers are captured. Confirm the depth gate when the stage is ready.`,
      artifact: stageArtifact(currentProgress.stage),
      frame: stagePromptFrame(currentProgress.stage),
      promptSource: promptSourceForDiscussStage(currentProgress.stage),
    };
  }

  return {
    banner: "QUESTIONING / project",
    title: "Keep the next answer load-bearing",
    nextAction: "Capture the next answer that should affect requirements, milestone scope, or verification.",
    artifact: ".gsd/PROJECT.md",
    frame: "Project discussion",
    promptSource: workflowPromptSources.discussProject,
  };
}

function guidanceForQuestion(question: DiscussQuestion): WorkflowGuidance {
  return {
    banner: question.stage === "requirements" ? "REQUIREMENTS" : `QUESTIONING / ${stageLabel(question.stage).toLowerCase()}`,
    title: question.stage === "requirements" ? "Keep capabilities testable" : "Ask one focused question",
    nextAction: question.prompt,
    artifact: stageArtifact(question.stage),
    frame: stagePromptFrame(question.stage),
    promptSource: promptSourceForDiscussStage(question.stage),
  };
}

function stageArtifact(stage: DiscussStage): string {
  switch (stage) {
    case "project":
      return ".gsd/PROJECT.md";
    case "requirements":
      return ".gsd/REQUIREMENTS.md";
    case "milestone":
      return ".gsd/milestones/M###/M###-CONTEXT.md";
  }
}

function stagePromptFrame(stage: DiscussStage): string {
  switch (stage) {
    case "project":
      return "Project discussion";
    case "requirements":
      return "Requirements";
    case "milestone":
      return "Milestone discussion";
  }
}

function WorkflowGuidanceCard({ guidance }: { readonly guidance: WorkflowGuidance }) {
  return (
    <section className="plan-guidance-card" data-testid="workflow-guidance-card">
      <div className="plan-guidance-card__main">
        <div className="plan-guidance-card__banner" data-testid="workflow-guidance-banner">
          {guidance.banner}
        </div>
        <strong>{guidance.title}</strong>
        <p data-testid="workflow-guidance-next-action">{guidance.nextAction}</p>
      </div>
      <dl className="plan-guidance-card__meta">
        <div>
          <dt>Artifact</dt>
          <dd data-testid="workflow-guidance-artifact">{guidance.artifact}</dd>
        </div>
        <div>
          <dt>Prompt frame</dt>
          <dd>{guidance.frame}</dd>
        </div>
        <div>
          <dt>GSD prompt</dt>
          <dd data-testid="workflow-guidance-prompt-source">
            {guidance.promptSource.family} · {guidance.promptSource.prompt}
            <span>{guidance.promptSource.purpose}</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}

function WorkflowPreferencesCard({
  preferences,
  globalPlanningPreferences,
  modelOptions,
  submitting,
  onApply,
  onUpdatePhaseOverrides,
}: {
  readonly preferences: WorkflowPreferencesRecord | undefined;
  readonly globalPlanningPreferences: GlobalPlanningPreferences;
  readonly modelOptions: readonly ComposerModelOption[];
  readonly submitting: boolean;
  readonly onApply: () => void;
  readonly onUpdatePhaseOverrides: (phaseOverrides: WorkflowPhaseModelPreferences) => void;
}) {
  const saved = Boolean(preferences?.capturedAt);
  const phaseOverrides = preferences?.models.phaseOverrides ?? {};
  return (
    <div className="plan-projection-card" data-testid="workflow-preferences-card">
      <div className="plan-workflow-preferences">
        <strong>{saved ? "Workflow preferences saved" : "Workflow preferences"}</strong>
        <span data-testid="workflow-preferences-summary">
          commit_policy: per-task · branch_model: single · uat_dispatch: true · research: skip
        </span>
        {saved ? (
          <div className="plan-phase-model-grid">
            {planningPhaseModelOptions.map((phase) => {
              const globalPreference = globalPlanningPreferences.phaseModels[phase.id];
              const overridePreference = phaseOverrides[phase.id];
              return (
                <label className="plan-phase-model-row" key={phase.id}>
                  <span>
                    <strong>{phase.label}</strong>
                    <small>Global: {formatPhaseModelPreference(globalPreference, modelOptions)}</small>
                  </span>
                  <select
                    className="settings-select plan-phase-model-row__select"
                    data-testid={`phase-model-select-${phase.id}`}
                    disabled={submitting}
                    value={phaseModelPreferenceToValue(overridePreference)}
                    onChange={(event) => {
                      const preference = phaseModelPreferenceFromValue(event.target.value);
                      onUpdatePhaseOverrides({
                        ...phaseOverrides,
                        [phase.id]: preference,
                      });
                    }}
                  >
                    <option value="">Use global default</option>
                    {modelOptions.map((model) => (
                      <option key={`${model.providerId}:${model.modelId}`} value={`${model.providerId}:${model.modelId}`}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        ) : null}
      </div>
      {saved ? (
        <span className="plan-execution-task__status plan-execution-task__status--done">Saved</span>
      ) : (
        <button
          className="plan-action-button plan-action-button--compact"
          data-testid="apply-workflow-preferences-button"
          disabled={submitting}
          onClick={onApply}
          type="button"
        >
          Apply defaults
        </button>
      )}
    </div>
  );
}

function buildWorkflowPreferenceUpdate(
  preferences: WorkflowPreferencesRecord,
  phaseOverrides: WorkflowPhaseModelPreferences,
): Omit<WorkflowPreferencesRecord, "capturedAt"> {
  return {
    commitPolicy: preferences.commitPolicy,
    branchModel: preferences.branchModel,
    uatDispatch: preferences.uatDispatch,
    research: preferences.research,
    workflowPrefsCaptured: preferences.workflowPrefsCaptured,
    models: {
      executorClass: preferences.models.executorClass,
      phaseOverrides,
    },
  };
}

function formatPhaseModelPreference(
  preference: WorkflowPhaseModelPreferences[PlanPhase] | undefined,
  modelOptions: readonly ComposerModelOption[],
): string {
  if (!preference) {
    return "Default model";
  }
  return (
    modelOptions.find(
      (option) => option.providerId === preference.providerId && option.modelId === preference.modelId,
    )?.label ?? `${preference.providerId}:${preference.modelId}`
  );
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
  onStartShip,
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
  readonly onStartShip: () => void;
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
    () => {
      const acceptanceByTaskId = new Map(planTasks.map((entry) => [entry.task.id, entry.acceptance]));
      const verificationMap = new Map<string, TaskVerificationRecord>();
      for (const verification of taskVerifications) {
        if (acceptanceByTaskId.get(verification.taskId) === verification.acceptance) {
          verificationMap.set(verification.taskId, verification);
        }
      }
      return verificationMap;
    },
    [planTasks, taskVerifications],
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
            <span>All task acceptance checks passed. SHIP is ready for final handoff.</span>
          </div>
          <button
            className="plan-action-button plan-action-button--compact"
            data-testid="start-ship-button"
            disabled={submitting}
            onClick={onStartShip}
            type="button"
          >
            Start ship
          </button>
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

function PlanShipGate({
  acceptedPlanProposal,
  shipSummaries,
  submitting,
  taskExecutions,
  taskVerifications,
  onRecordShipSummary,
}: {
  readonly acceptedPlanProposal: PlanningPlanProposalDraft | undefined;
  readonly shipSummaries: readonly ShipSummaryRecord[];
  readonly submitting: boolean;
  readonly taskExecutions: readonly TaskExecutionRecord[];
  readonly taskVerifications: readonly TaskVerificationRecord[];
  readonly onRecordShipSummary: (summary: string) => void;
}) {
  const planTasks = useMemo(
    () => (acceptedPlanProposal ? getPlanTaskEntries(acceptedPlanProposal) : []),
    [acceptedPlanProposal],
  );
  const taskExecutionMap = useMemo(
    () => new Map(taskExecutions.map((execution) => [execution.taskId, execution])),
    [taskExecutions],
  );
  const taskVerificationMap = useMemo(
    () => {
      const acceptanceByTaskId = new Map(planTasks.map((entry) => [entry.task.id, entry.acceptance]));
      const verificationMap = new Map<string, TaskVerificationRecord>();
      for (const verification of taskVerifications) {
        if (acceptanceByTaskId.get(verification.taskId) === verification.acceptance) {
          verificationMap.set(verification.taskId, verification);
        }
      }
      return verificationMap;
    },
    [planTasks, taskVerifications],
  );
  const latestSummary = shipSummaries[shipSummaries.length - 1];
  const defaultSummary = useMemo(
    () => buildShipSummaryDraft(acceptedPlanProposal, taskExecutions, taskVerifications),
    [acceptedPlanProposal, taskExecutions, taskVerifications],
  );
  const [summaryDraft, setSummaryDraft] = useState("");

  useEffect(() => {
    setSummaryDraft(latestSummary?.summary ?? defaultSummary);
  }, [defaultSummary, latestSummary?.id, latestSummary?.summary]);

  return (
    <div className="plan-execution" data-testid="plan-ship-panel">
      <div className="plan-depth-card plan-depth-card--complete">
        <div className="plan-depth-card__eyebrow">SHIP · ACTIVE</div>
        <h2>Ship handoff</h2>
        <p>
          {acceptedPlanProposal
            ? `${planTasks.length} verified task${planTasks.length === 1 ? "" : "s"} ready for release summary.`
            : "Accepted plan content could not be loaded."}
        </p>
      </div>

      {latestSummary ? (
        <div className="plan-projection-card" data-testid="ship-summary-recorded">
          <div>
            <strong>Ship summary saved</strong>
            <span>{latestSummary.summary}</span>
          </div>
        </div>
      ) : null}

      <div className="plan-ship-summary">
        <label className="plan-execution-task-editor__field">
          <span>Handoff summary</span>
          <textarea
            data-testid="ship-summary-textarea"
            onChange={(event) => setSummaryDraft(event.target.value)}
            value={summaryDraft}
          />
        </label>
        <button
          className="plan-action-button plan-action-button--compact"
          data-testid="record-ship-summary-button"
          disabled={submitting || !summaryDraft.trim()}
          onClick={() => onRecordShipSummary(summaryDraft)}
          type="button"
        >
          Save ship summary
        </button>
      </div>

      {acceptedPlanProposal ? (
        <div className="plan-execution-list">
          {planTasks.map((entry) => {
            const execution = taskExecutionMap.get(entry.task.id);
            const verification = taskVerificationMap.get(entry.task.id);
            return (
              <article className="plan-execution-task" key={entry.taskPath} data-testid="ship-task">
                <div className="plan-execution-task__header">
                  <span>{entry.task.id}</span>
                  <strong>{entry.task.title}</strong>
                  <span className="plan-execution-task__status plan-execution-task__status--passed">
                    {formatTaskVerificationStatus(verification?.status)}
                  </span>
                </div>
                <p>{entry.acceptance}</p>
                {execution?.evidence.length ? (
                  <div className="plan-execution-evidence" data-testid="ship-evidence-list">
                    {execution.evidence.map((evidence) => (
                      <span key={evidence.id}>{evidence.text}</span>
                    ))}
                  </div>
                ) : null}
                {verification?.note ? (
                  <p className="plan-execution-task__note" data-testid="ship-verification-note">
                    Verification: {verification.note}
                  </p>
                ) : null}
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

function ChangeProposalCard({
  acceptedPlanProposal,
  proposal,
  submitting,
  onApprove,
  onApproveModification,
  onHideTask,
}: {
  readonly acceptedPlanProposal: PlanningPlanProposalDraft | undefined;
  readonly proposal: ChangeProposalRecord;
  readonly submitting: boolean;
  readonly onApprove: (proposal: ChangeProposalRecord, draft: PlanInjectionApprovalDraft) => void;
  readonly onApproveModification: (proposal: ChangeProposalRecord, draft: PlanTaskModificationDraft) => void;
  readonly onHideTask: (taskPath: string, reason: string) => void;
}) {
  const targets = useMemo(() => getPlanSliceTargets(acceptedPlanProposal), [acceptedPlanProposal]);
  const taskEntries = useMemo(
    () => (acceptedPlanProposal ? getPlanTaskEntries(acceptedPlanProposal) : []),
    [acceptedPlanProposal],
  );
  const activeTaskPaths = useMemo(
    () => new Set(taskEntries.map((entry) => entry.taskPath)),
    [taskEntries],
  );
  const defaultTargetId = targets[0]?.id ?? "";
  const defaultModificationTaskPath = taskEntries[0]?.taskPath ?? "";
  const defaultTaskId = useMemo(
    () =>
      acceptedPlanProposal
        ? nextPlanId("T", taskEntries.map((entry) => entry.task.id))
        : "",
    [acceptedPlanProposal, taskEntries],
  );
  const [targetId, setTargetId] = useState(defaultTargetId);
  const [taskId, setTaskId] = useState(defaultTaskId);
  const [taskTitle, setTaskTitle] = useState(proposal.title);
  const [taskAcceptance, setTaskAcceptance] = useState(buildDefaultInjectionAcceptance(proposal));
  const [dependencies, setDependencies] = useState("");
  const [modificationTaskPath, setModificationTaskPath] = useState(defaultModificationTaskPath);
  const selectedModificationTask =
    taskEntries.find((entry) => entry.taskPath === modificationTaskPath) ?? taskEntries[0];
  const [modifiedTaskTitle, setModifiedTaskTitle] = useState(selectedModificationTask?.task.title ?? proposal.title);
  const [modifiedTaskAcceptance, setModifiedTaskAcceptance] = useState(
    selectedModificationTask?.task.acceptance ?? buildDefaultInjectionAcceptance(proposal),
  );
  const [modifiedDependencies, setModifiedDependencies] = useState(
    selectedModificationTask?.task.dependencies.join(", ") ?? "",
  );
  const [hideReason, setHideReason] = useState("No longer needed in the active plan.");
  const selectedTarget = targets.find((target) => target.id === targetId) ?? targets[0];
  const injectedTaskActive = proposal.injectedTaskPath ? activeTaskPaths.has(proposal.injectedTaskPath) : false;
  const canApprove =
    proposal.status === "draft" &&
    Boolean(selectedTarget) &&
    Boolean(taskId.trim()) &&
    Boolean(taskTitle.trim()) &&
    Boolean(taskAcceptance.trim()) &&
    !submitting;
  const canApproveModification =
    proposal.status === "draft" &&
    Boolean(selectedModificationTask) &&
    Boolean(modifiedTaskTitle.trim()) &&
    Boolean(modifiedTaskAcceptance.trim()) &&
    !submitting;

  useEffect(() => {
    setTargetId(defaultTargetId);
    setTaskId(defaultTaskId);
    setTaskTitle(proposal.title);
    setTaskAcceptance(buildDefaultInjectionAcceptance(proposal));
    setDependencies("");
    setModificationTaskPath(defaultModificationTaskPath);
    setHideReason("No longer needed in the active plan.");
  }, [
    defaultModificationTaskPath,
    defaultTargetId,
    defaultTaskId,
    proposal.id,
    proposal.impactNotes,
    proposal.summary,
    proposal.title,
  ]);

  useEffect(() => {
    if (!selectedModificationTask) {
      setModifiedTaskTitle(proposal.title);
      setModifiedTaskAcceptance(buildDefaultInjectionAcceptance(proposal));
      setModifiedDependencies("");
      return;
    }
    setModifiedTaskTitle(selectedModificationTask.task.title);
    setModifiedTaskAcceptance(selectedModificationTask.task.acceptance);
    setModifiedDependencies(selectedModificationTask.task.dependencies.join(", "));
  }, [proposal.impactNotes, proposal.summary, proposal.title, selectedModificationTask?.taskPath]);

  const submitApproval = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTarget || !canApprove) {
      return;
    }
    onApprove(proposal, {
      targetMilestoneId: selectedTarget.milestoneId,
      targetSliceId: selectedTarget.sliceId,
      taskId: taskId.trim(),
      taskTitle: taskTitle.trim(),
      taskAcceptance: taskAcceptance.trim(),
      dependencies,
    });
  };

  const submitHideTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reason = hideReason.trim();
    if (!proposal.injectedTaskPath || !reason || submitting) {
      return;
    }
    onHideTask(proposal.injectedTaskPath, reason);
  };

  const submitModification = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedModificationTask || !canApproveModification) {
      return;
    }
    onApproveModification(proposal, {
      taskPath: selectedModificationTask.taskPath,
      taskTitle: modifiedTaskTitle.trim(),
      taskAcceptance: modifiedTaskAcceptance.trim(),
      dependencies: modifiedDependencies,
    });
  };

  return (
    <article className="plan-memory__item plan-memory__item--proposal" data-testid="plan-change-proposal">
      <div className="plan-memory__item-header">
        <span>{proposal.title}</span>
        <small data-testid="plan-change-proposal-status">{formatChangeProposalStatus(proposal.status)}</small>
      </div>
      <p>{proposal.summary}</p>
      <p className="plan-memory__note">{proposal.impactNotes}</p>
      {proposal.injectedTaskPath ? (
        <p className="plan-memory__note">Injected as {proposal.injectedTaskPath}</p>
      ) : null}
      {proposal.modifiedTaskPath ? (
        <p className="plan-memory__note">Modified {proposal.modifiedTaskPath}</p>
      ) : null}
      {proposal.status === "approved" && proposal.injectedTaskPath && !injectedTaskActive ? (
        <p className="plan-memory__note" data-testid="plan-hidden-task-note">
          Hidden from active plan
        </p>
      ) : null}
      {proposal.status === "draft" && !acceptedPlanProposal ? (
        <p className="plan-memory__note">Accept a plan before approving this change.</p>
      ) : null}
      {proposal.status === "draft" && acceptedPlanProposal ? (
        <form className="plan-change-draft" data-testid="plan-injection-form" onSubmit={submitApproval}>
          <label>
            <span>Target slice</span>
            <select
              data-testid="plan-injection-target-select"
              onChange={(event) => setTargetId(event.target.value)}
              value={targetId}
            >
              {targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Task id</span>
            <input
              data-testid="plan-injection-task-id-input"
              onChange={(event) => setTaskId(event.target.value)}
              value={taskId}
            />
          </label>
          <label>
            <span>Task title</span>
            <input
              data-testid="plan-injection-task-title-input"
              onChange={(event) => setTaskTitle(event.target.value)}
              value={taskTitle}
            />
          </label>
          <label>
            <span>Acceptance</span>
            <textarea
              data-testid="plan-injection-task-acceptance-textarea"
              onChange={(event) => setTaskAcceptance(event.target.value)}
              value={taskAcceptance}
            />
          </label>
          <label>
            <span>Dependencies</span>
            <input
              data-testid="plan-injection-task-dependencies-input"
              onChange={(event) => setDependencies(event.target.value)}
              placeholder="T1, T2"
              value={dependencies}
            />
          </label>
          <div className="plan-memory__editor-actions">
            <button className="plan-action-button plan-action-button--compact" disabled={!canApprove} type="submit">
              Approve injection
            </button>
          </div>
        </form>
      ) : null}
      {proposal.status === "draft" && acceptedPlanProposal ? (
        <form className="plan-change-draft" data-testid="plan-modification-form" onSubmit={submitModification}>
          <label>
            <span>Modify task</span>
            <select
              data-testid="plan-modification-task-select"
              onChange={(event) => setModificationTaskPath(event.target.value)}
              value={modificationTaskPath}
            >
              {taskEntries.map((entry) => (
                <option key={entry.taskPath} value={entry.taskPath}>
                  {entry.taskPath} · {entry.task.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Task title</span>
            <input
              data-testid="plan-modification-task-title-input"
              onChange={(event) => setModifiedTaskTitle(event.target.value)}
              value={modifiedTaskTitle}
            />
          </label>
          <label>
            <span>Acceptance</span>
            <textarea
              data-testid="plan-modification-task-acceptance-textarea"
              onChange={(event) => setModifiedTaskAcceptance(event.target.value)}
              value={modifiedTaskAcceptance}
            />
          </label>
          <label>
            <span>Dependencies</span>
            <input
              data-testid="plan-modification-task-dependencies-input"
              onChange={(event) => setModifiedDependencies(event.target.value)}
              placeholder="T1, T2"
              value={modifiedDependencies}
            />
          </label>
          <div className="plan-memory__editor-actions">
            <button
              className="plan-secondary-button plan-secondary-button--compact"
              disabled={!canApproveModification}
              type="submit"
            >
              Approve modification
            </button>
          </div>
        </form>
      ) : null}
      {proposal.status === "approved" && proposal.injectedTaskPath && injectedTaskActive ? (
        <form className="plan-change-draft" data-testid="plan-hide-task-form" onSubmit={submitHideTask}>
          <label>
            <span>Removal reason</span>
            <textarea
              data-testid="plan-hide-task-reason-textarea"
              onChange={(event) => setHideReason(event.target.value)}
              value={hideReason}
            />
          </label>
          <div className="plan-memory__editor-actions">
            <button
              className="plan-secondary-button plan-secondary-button--compact"
              disabled={submitting || !hideReason.trim()}
              type="submit"
            >
              Hide injected task
            </button>
          </div>
        </form>
      ) : null}
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
    phases: [],
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

function getPlanSliceTargets(proposal: PlanningPlanProposalDraft | undefined): readonly PlanSliceTarget[] {
  return proposal
    ? proposal.milestones.flatMap((milestone) =>
        milestone.slices.map((slice) => ({
          id: `${milestone.id}/${slice.id}`,
          label: `${milestone.id}/${slice.id} · ${slice.title}`,
          milestoneId: milestone.id,
          sliceId: slice.id,
        })),
      )
    : [];
}

function buildShipSummaryDraft(
  proposal: PlanningPlanProposalDraft | undefined,
  taskExecutions: readonly TaskExecutionRecord[],
  taskVerifications: readonly TaskVerificationRecord[],
): string {
  if (!proposal) {
    return "";
  }
  const executionMap = new Map(taskExecutions.map((execution) => [execution.taskId, execution]));
  const verificationMap = new Map(taskVerifications.map((verification) => [verification.taskId, verification]));
  const lines = ["Ship summary", ""];

  for (const entry of getPlanTaskEntries(proposal)) {
    const execution = executionMap.get(entry.task.id);
    const verification = verificationMap.get(entry.task.id);
    lines.push(`- ${entry.taskPath}: ${entry.task.title}`);
    lines.push(`  Acceptance: ${entry.acceptance}`);
    lines.push(`  Verification: ${formatTaskVerificationStatus(verification?.status)}${verification?.note ? ` - ${verification.note}` : ""}`);
    if (execution?.evidence.length) {
      lines.push(`  Evidence: ${execution.evidence.map((evidence) => evidence.text).join("; ")}`);
    }
  }

  return lines.join("\n");
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

function formatRequirementClass(value: RequirementRecord["class"]): string {
  switch (value) {
    case "functional":
      return "Functional";
    case "quality":
      return "Quality";
    case "constraint":
      return "Constraint";
    case "integration":
      return "Integration";
    case "operational":
      return "Operational";
  }
}

function formatRequirementStatus(value: RequirementRecord["status"]): string {
  switch (value) {
    case "active":
      return "Active";
    case "validated":
      return "Validated";
    case "deferred":
      return "Deferred";
    case "out-of-scope":
      return "Out of scope";
  }
}

function formatRequirementSource(value: RequirementRecord["source"]): string {
  switch (value) {
    case "user":
      return "User";
    case "inferred":
      return "Inferred";
    case "research":
      return "Research";
    case "execution":
      return "Execution";
  }
}

function formatRequirementValidationStatus(value: RequirementRecord["validationStatus"]): string {
  switch (value) {
    case "unvalidated":
      return "Unvalidated";
    case "covered":
      return "Covered";
    case "partial":
      return "Partial";
    case "missing":
      return "Missing";
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

function formatShipStatus(started: boolean, summaryCount: number): string {
  if (started) {
    return summaryCount > 0 ? "Summary saved" : "Active";
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

function formatIdeaReviewStatus(status: ParkedItemReviewStatus): string {
  switch (status) {
    case "parked":
      return "Parked";
    case "kept":
      return "Kept";
    case "promotion-ready":
      return "Ready to promote";
    case "dismissed":
      return "Dismissed";
  }
}

function reviewIdeaNote(status: ParkedItemReviewStatus): string {
  switch (status) {
    case "parked":
      return "Parked for later review";
    case "kept":
      return "Kept in the idea pool for later review.";
    case "promotion-ready":
      return "Prepared for promotion into a change proposal.";
    case "dismissed":
      return "Dismissed from active consideration.";
  }
}

function formatChangeProposalStatus(status: ChangeProposalRecord["status"]): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "approved":
      return "Approved";
  }
}

function buildChangeProposalTitle(item: ParkedItemRecord): string {
  const normalized = item.text.replace(/\s+/g, " ").trim();
  return normalized.length > 48 ? `${normalized.slice(0, 45)}...` : normalized;
}

function buildChangeProposalImpactDraft(item: ParkedItemRecord): string {
  return [
    `Source idea: ${item.text}`,
    "",
    "Impact notes:",
    "- Active plan changes to consider:",
    "- Milestones, slices, or tasks likely affected:",
    "- Verification evidence needed before approval:",
  ].join("\n");
}

function buildDefaultInjectionAcceptance(proposal: ChangeProposalRecord): string {
  const impactLine = proposal.impactNotes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return impactLine ?? proposal.summary;
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
