export type PlanId = string;
export type PlanEventId = string;
export type RequirementId = `R${string}`;

export type PlanStatus = "draft" | "active" | "approved" | "archived";
export type PlanPhase = "discuss" | "research" | "plan" | "execute" | "verify" | "ship";
export type PlanStage =
  | "project"
  | "requirements"
  | "milestone"
  | "research"
  | "roadmap"
  | "slice-context"
  | "task";
export type StageStatus = "not-started" | "active" | "needs-review" | "approved" | "blocked";

export type RequirementClass = "functional" | "quality" | "constraint" | "integration" | "operational";
export type RequirementStatus = "active" | "validated" | "deferred" | "out-of-scope";
export type RequirementSource = "user" | "inferred" | "research" | "execution";
export type RequirementValidationStatus = "unvalidated" | "covered" | "partial" | "missing";

export interface ProjectShape {
  readonly complexity: "simple" | "complex";
  readonly rationale: string;
}

export interface ProjectSummary {
  readonly title?: string;
  readonly vision?: string;
  readonly users?: string;
  readonly coreValue?: string;
  readonly antiGoals: readonly string[];
  readonly constraints: readonly string[];
  readonly shape?: ProjectShape;
}

export interface RequirementRecord {
  readonly id: RequirementId;
  readonly title: string;
  readonly class: RequirementClass;
  readonly status: RequirementStatus;
  readonly description: string;
  readonly why: string;
  readonly source: RequirementSource;
  readonly owner: string;
  readonly validationStatus: RequirementValidationStatus;
  readonly notes?: string;
}

export interface AnswerRecord {
  readonly id: string;
  readonly stage: PlanStage;
  readonly questionId: string;
  readonly prompt: string;
  readonly answer: string;
  readonly loadBearing: boolean;
  readonly discretionRationale?: string;
  readonly revisedFromAnswerId?: string;
  readonly createdAt: string;
}

export interface StageStateRecord {
  readonly stage: PlanStage;
  readonly status: StageStatus;
  readonly activeQuestionId?: string;
  readonly depthConfirmedAt?: string;
}

export interface GeneratedOutputRecord {
  readonly id: string;
  readonly stage: PlanStage;
  readonly title: string;
  readonly content: string;
  readonly status: "draft" | "proposed" | "accepted" | "rejected";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TaskSessionLinkRecord {
  readonly id: string;
  readonly taskId: string;
  readonly taskPath: string;
  readonly workspaceId: string;
  readonly sessionId: string;
  readonly title: string;
  readonly createdAt: string;
}

export type TaskExecutionStatus = "not-started" | "in-progress" | "blocked" | "done";

export interface TaskEvidenceRecord {
  readonly id: string;
  readonly taskId: string;
  readonly taskPath: string;
  readonly text: string;
  readonly createdAt: string;
}

export interface TaskExecutionRecord {
  readonly taskId: string;
  readonly taskPath: string;
  readonly status: TaskExecutionStatus;
  readonly note: string;
  readonly blocker: string;
  readonly evidence: readonly TaskEvidenceRecord[];
  readonly updatedAt: string;
}

export type TaskVerificationStatus = "passed" | "failed";

export interface TaskVerificationRecord {
  readonly id: string;
  readonly taskId: string;
  readonly taskPath: string;
  readonly acceptance: string;
  readonly status: TaskVerificationStatus;
  readonly note: string;
  readonly createdAt: string;
}

export interface ShipSummaryRecord {
  readonly id: string;
  readonly summary: string;
  readonly createdAt: string;
}

export type WorkflowCommitPolicy = "per-task";
export type WorkflowBranchModel = "single";
export type WorkflowResearchMode = "skip" | "research";
export type WorkflowExecutorClass = "balanced";

export interface WorkflowPhaseModelPreference {
  readonly providerId: string;
  readonly modelId: string;
}

export type WorkflowPhaseModelPreferences = Partial<Record<PlanPhase, WorkflowPhaseModelPreference>>;

export interface WorkflowPreferencesRecord {
  readonly commitPolicy: WorkflowCommitPolicy;
  readonly branchModel: WorkflowBranchModel;
  readonly uatDispatch: boolean;
  readonly research: WorkflowResearchMode;
  readonly models: {
    readonly executorClass: WorkflowExecutorClass;
    readonly phaseOverrides?: WorkflowPhaseModelPreferences;
  };
  readonly workflowPrefsCaptured: boolean;
  readonly capturedAt: string;
}

export type ParkedItemReviewStatus = "parked" | "kept" | "dismissed" | "promotion-ready";

export interface ParkedItemRecord {
  readonly id: string;
  readonly sourceType: "answer";
  readonly sourceAnswerId: string;
  readonly sourceStage: PlanStage;
  readonly sourceQuestionId: string;
  readonly sourcePrompt: string;
  readonly text: string;
  readonly rationale: string;
  readonly reviewStatus: ParkedItemReviewStatus;
  readonly reviewNote?: string;
  readonly reviewedAt?: string;
  readonly createdAt: string;
}

export type ChangeProposalStatus = "draft" | "approved";

export interface ChangeProposalRecord {
  readonly id: string;
  readonly sourceType: "parked-item";
  readonly sourceParkedItemId: string;
  readonly title: string;
  readonly summary: string;
  readonly impactNotes: string;
  readonly status: ChangeProposalStatus;
  readonly approvedAt?: string;
  readonly injectedTaskPath?: string;
  readonly modifiedTaskPath?: string;
  readonly acceptedOutputId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ApprovedPlanInjectionRecord {
  readonly id: string;
  readonly changeProposalId: string;
  readonly sourceParkedItemId: string;
  readonly acceptedOutputId: string;
  readonly targetMilestoneId: string;
  readonly targetSliceId: string;
  readonly taskId: string;
  readonly taskPath: string;
  readonly title: string;
  readonly acceptance: string;
  readonly dependencies: readonly string[];
  readonly createdAt: string;
}

export interface ApprovedPlanModificationRecord {
  readonly id: string;
  readonly changeProposalId: string;
  readonly sourceParkedItemId: string;
  readonly acceptedOutputId: string;
  readonly targetMilestoneId: string;
  readonly targetSliceId: string;
  readonly taskId: string;
  readonly taskPath: string;
  readonly previousTitle: string;
  readonly title: string;
  readonly previousAcceptance: string;
  readonly acceptance: string;
  readonly previousDependencies: readonly string[];
  readonly dependencies: readonly string[];
  readonly createdAt: string;
}

export interface HiddenPlanItemRecord {
  readonly id: string;
  readonly targetType: "task";
  readonly targetId: string;
  readonly targetPath: string;
  readonly reason: string;
  readonly acceptedOutputId: string;
  readonly createdAt: string;
}

export type PlanEvent =
  | {
      readonly type: "project.updated";
      readonly project: Partial<ProjectSummary>;
    }
  | {
      readonly type: "phase.updated";
      readonly phase: PlanPhase;
      readonly stage: PlanStage;
    }
  | {
      readonly type: "stage.updated";
      readonly stage: PlanStage;
      readonly status?: StageStatus;
      readonly activeQuestionId?: string;
    }
  | {
      readonly type: "stage.depth-confirmed";
      readonly stage: PlanStage;
    }
  | {
      readonly type: "answer.recorded";
      readonly answer: Omit<AnswerRecord, "id" | "createdAt"> & {
        readonly id?: string;
      };
    }
  | {
      readonly type: "answer.revised";
      readonly answerId: string;
      readonly answer: string;
      readonly rationale?: string;
    }
  | {
      readonly type: "requirement.upserted";
      readonly requirement: RequirementRecord;
    }
  | {
      readonly type: "generated-output.proposed";
      readonly output: Omit<GeneratedOutputRecord, "createdAt" | "updatedAt" | "status"> & {
        readonly status?: "draft" | "proposed";
      };
    }
  | {
      readonly type: "generated-output.reviewed";
      readonly outputId: string;
      readonly status: "accepted" | "rejected";
    }
  | {
      readonly type: "task.session-linked";
      readonly link: Omit<TaskSessionLinkRecord, "id" | "createdAt"> & {
        readonly id?: string;
      };
    }
  | {
      readonly type: "task.status-updated";
      readonly task: Omit<TaskExecutionRecord, "evidence" | "updatedAt">;
    }
  | {
      readonly type: "task.evidence-recorded";
      readonly evidence: Omit<TaskEvidenceRecord, "id" | "createdAt"> & {
        readonly id?: string;
      };
    }
  | {
      readonly type: "task.verification-recorded";
      readonly verification: Omit<TaskVerificationRecord, "id" | "createdAt"> & {
        readonly id?: string;
      };
    }
  | {
      readonly type: "ship.summary-recorded";
      readonly summary: Omit<ShipSummaryRecord, "id" | "createdAt"> & {
        readonly id?: string;
      };
    }
  | {
      readonly type: "workflow.preferences-updated";
      readonly preferences: Omit<WorkflowPreferencesRecord, "capturedAt"> & {
        readonly capturedAt?: string;
      };
    }
  | {
      readonly type: "idea.parked";
      readonly item: Omit<ParkedItemRecord, "id" | "createdAt" | "reviewStatus" | "reviewNote" | "reviewedAt"> & {
        readonly id?: string;
      };
    }
  | {
      readonly type: "idea.reviewed";
      readonly itemId: string;
      readonly status: ParkedItemReviewStatus;
      readonly note?: string;
    }
  | {
      readonly type: "change.proposal-drafted";
      readonly proposal: Omit<
        ChangeProposalRecord,
        "id" | "createdAt" | "updatedAt" | "status" | "approvedAt" | "injectedTaskPath" | "acceptedOutputId"
      > & {
        readonly id?: string;
        readonly status?: ChangeProposalStatus;
      };
    }
  | {
      readonly type: "change.proposal-approved";
      readonly proposalId: string;
      readonly injection: Omit<ApprovedPlanInjectionRecord, "id" | "createdAt"> & {
        readonly id?: string;
      };
    }
  | {
      readonly type: "change.proposal-modification-approved";
      readonly proposalId: string;
      readonly modification: Omit<ApprovedPlanModificationRecord, "id" | "createdAt"> & {
        readonly id?: string;
      };
    }
  | {
      readonly type: "plan.item-hidden";
      readonly item: Omit<HiddenPlanItemRecord, "id" | "createdAt"> & {
        readonly id?: string;
      };
    };

export interface PersistedPlanEvent {
  readonly id: PlanEventId;
  readonly planId: PlanId;
  readonly revision: number;
  readonly type: PlanEvent["type"];
  readonly payload: PlanEvent;
  readonly createdAt: string;
}

export interface PlanListEntry {
  readonly id: PlanId;
  readonly readableId: string;
  readonly name: string;
  readonly status: PlanStatus;
  readonly activePhase: PlanPhase;
  readonly activeStage: PlanStage;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PlanSnapshot extends PlanListEntry {
  readonly project: ProjectSummary;
  readonly requirements: readonly RequirementRecord[];
  readonly answers: readonly AnswerRecord[];
  readonly stages: readonly StageStateRecord[];
  readonly generatedOutputs: readonly GeneratedOutputRecord[];
  readonly taskSessionLinks: readonly TaskSessionLinkRecord[];
  readonly taskExecutions: readonly TaskExecutionRecord[];
  readonly taskVerifications: readonly TaskVerificationRecord[];
  readonly shipSummaries: readonly ShipSummaryRecord[];
  readonly workflowPreferences?: WorkflowPreferencesRecord;
  readonly parkedItems: readonly ParkedItemRecord[];
  readonly changeProposals: readonly ChangeProposalRecord[];
  readonly approvedInjections: readonly ApprovedPlanInjectionRecord[];
  readonly approvedModifications: readonly ApprovedPlanModificationRecord[];
  readonly hiddenPlanItems: readonly HiddenPlanItemRecord[];
  readonly events: readonly PersistedPlanEvent[];
}

export interface CreatePlanInput {
  readonly name: string;
  readonly readableId?: string;
  readonly initialPhase?: PlanPhase;
  readonly initialStage?: PlanStage;
}

export interface AppendPlanEventInput {
  readonly planId: PlanId;
  readonly expectedRevision: number;
  readonly event: PlanEvent;
}

export interface PlanningStore {
  createPlan(input: CreatePlanInput): PlanSnapshot;
  listPlans(): readonly PlanListEntry[];
  getPlanSnapshot(planId: PlanId): PlanSnapshot | undefined;
  appendEvent(input: AppendPlanEventInput): PlanSnapshot;
  close(): void;
}
