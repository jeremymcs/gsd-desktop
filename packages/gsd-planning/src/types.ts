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

export type PlanEvent =
  | {
      readonly type: "project.updated";
      readonly project: Partial<ProjectSummary>;
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

