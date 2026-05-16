import {
  openPlanningStore,
  planningDatabasePath,
  type PlanEvent,
  type PlanListEntry,
  type PlanSnapshot,
  type PlanningStore,
} from "@pi-gui/gsd-planning";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import type {
  ConfirmPlanningStageInput,
  CreatePlanningPlanInput,
  DesktopAppState,
  ProposePlanningResearchInput,
  RecordPlanningAnswerInput,
  ReviewPlanningResearchInput,
  RevisePlanningAnswerInput,
  SelectPlanningPlanInput,
  StartPlanningResearchInput,
  WorkspacePlanningState,
} from "../src/desktop-state";
import {
  discussStageOrder,
  getDiscussQuestionsForStage,
  getDiscussStageProgress,
  getNextDiscussStage,
  getNextUnansweredQuestion,
  isDiscussStage,
  type DiscussStage,
} from "../src/plan-builder-discuss";
import { resolveRepoWorkspaceId } from "../src/workspace-roots";
import type { AppStoreInternals } from "./app-store-internals";

export async function loadPlanningWorkspace(
  store: AppStoreInternals,
  workspaceId: string,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    if (!existsSync(planningDatabasePath(workspace.path))) {
      return publishPlanningState(store, workspace.id, workspace.path, [], undefined, {
        activeView: "plans",
      });
    }

    return withPlanningStore(workspace.path, (planningStore) => {
      const existing = store.state.planningByWorkspace[workspace.id];
      const plans = planningStore.listPlans();
      const selectedPlanId = resolveSelectedPlanId(plans, existing?.selectedPlanId);
      const selectedPlan = selectedPlanId ? planningStore.getPlanSnapshot(selectedPlanId) : undefined;
      return publishPlanningState(store, workspace.id, workspace.path, plans, selectedPlan, {
        activeView: "plans",
      });
    });
  });
}

export async function createPlanningPlan(
  store: AppStoreInternals,
  input: CreatePlanningPlanInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = planningStore.createPlan({
        name: input.name,
        initialPhase: "discuss",
        initialStage: "project",
      });
      const firstQuestion = getDiscussQuestionsForStage("project")[0];
      if (firstQuestion) {
        snapshot = appendEvent(planningStore, snapshot, {
          type: "stage.updated",
          stage: "project",
          status: "active",
          activeQuestionId: firstQuestion.id,
        });
      }
      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function selectPlanningPlan(
  store: AppStoreInternals,
  input: SelectPlanningPlanInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      const snapshot = planningStore.getPlanSnapshot(input.planId);
      if (!snapshot) {
        throw new Error(`Unknown plan: ${input.planId}`);
      }
      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function recordPlanningAnswer(
  store: AppStoreInternals,
  input: RecordPlanningAnswerInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }
  if (!isDiscussStage(input.stage)) {
    return store.withError(`Unsupported planning stage: ${input.stage}`);
  }
  const stage = input.stage;

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "answer.recorded",
          answer: {
            stage,
            questionId: input.questionId,
            prompt: input.prompt,
            answer: input.answer,
            loadBearing: input.loadBearing,
            ...(input.discretionRationale ? { discretionRationale: input.discretionRationale } : {}),
          },
        },
      });

      if (input.projectPatch) {
        snapshot = appendEvent(planningStore, snapshot, {
          type: "project.updated",
          project: input.projectPatch,
        });
      }

      snapshot = advanceDiscussStageAfterAnswer(planningStore, snapshot, stage);
      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function revisePlanningAnswer(
  store: AppStoreInternals,
  input: RevisePlanningAnswerInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "answer.revised",
          answerId: input.answerId,
          answer: input.answer,
          ...(input.rationale ? { rationale: input.rationale } : {}),
        },
      });

      if (input.projectPatch) {
        snapshot = appendEvent(planningStore, snapshot, {
          type: "project.updated",
          project: input.projectPatch,
        });
      }

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function confirmPlanningStage(
  store: AppStoreInternals,
  input: ConfirmPlanningStageInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }
  if (!isDiscussStage(input.stage)) {
    return store.withError(`Unsupported planning stage: ${input.stage}`);
  }
  const stage = input.stage;

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "stage.depth-confirmed",
          stage,
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "stage.updated",
        stage,
        status: "approved",
        activeQuestionId: "",
      });

      const nextStage = getNextDiscussStage(stage);
      const firstQuestion = nextStage ? getDiscussQuestionsForStage(nextStage)[0] : undefined;
      if (nextStage && firstQuestion) {
        snapshot = appendEvent(planningStore, snapshot, {
          type: "stage.updated",
          stage: nextStage,
          status: "active",
          activeQuestionId: firstQuestion.id,
        });
      }

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function startPlanningResearch(
  store: AppStoreInternals,
  input: StartPlanningResearchInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      assertDiscussComplete(snapshot);

      const researchStage = snapshot.stages.find((entry) => entry.stage === "research");
      const researchAlreadyStarted =
        researchStage?.status === "active" ||
        researchStage?.status === "needs-review" ||
        researchStage?.status === "approved";
      if (researchAlreadyStarted) {
        return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
      }

      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "stage.updated",
          stage: "research",
          status: "active",
          activeQuestionId: "",
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function proposePlanningResearch(
  store: AppStoreInternals,
  input: ProposePlanningResearchInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  const title = input.title.trim();
  const content = input.content.trim();
  if (!title) {
    return store.withError("Research title is required");
  }
  if (!content) {
    return store.withError("Research content is required");
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      assertDiscussComplete(snapshot);

      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "generated-output.proposed",
          output: {
            id: randomUUID(),
            stage: "research",
            title,
            content,
            status: "proposed",
          },
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "stage.updated",
        stage: "research",
        status: "needs-review",
        activeQuestionId: "",
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function reviewPlanningResearch(
  store: AppStoreInternals,
  input: ReviewPlanningResearchInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      const output = snapshot.generatedOutputs.find((entry) => entry.id === input.outputId);
      if (!output || output.stage !== "research") {
        throw new Error(`Unknown research output: ${input.outputId}`);
      }

      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "generated-output.reviewed",
          outputId: input.outputId,
          status: input.status,
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "stage.updated",
        stage: "research",
        status: snapshot.generatedOutputs.some((entry) => entry.stage === "research" && entry.status === "accepted")
          ? "approved"
          : "active",
        activeQuestionId: "",
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

function resolvePlanningWorkspace(
  store: AppStoreInternals,
  workspaceId: string,
): { readonly id: string; readonly path: string } | undefined {
  const rootWorkspaceId = resolveRepoWorkspaceId(store.state.workspaces, workspaceId) ?? workspaceId;
  const workspace = store.state.workspaces.find((entry) => entry.id === rootWorkspaceId);
  if (!workspace) {
    return undefined;
  }
  return {
    id: workspace.id,
    path: workspace.path,
  };
}

function withPlanningStore<T>(
  workspacePath: string,
  fn: (planningStore: PlanningStore) => T | Promise<T>,
): T | Promise<T> {
  const planningStore = openPlanningStore({ workspaceRoot: workspacePath });
  try {
    const result = fn(planningStore);
    if (isPromiseLike(result)) {
      return result.finally(() => {
        planningStore.close();
      });
    }
    planningStore.close();
    return result;
  } catch (error) {
    planningStore.close();
    throw error;
  }
}

function isPromiseLike<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof value === "object" && value !== null && typeof (value as Promise<T>).finally === "function";
}

function appendEvent(planningStore: PlanningStore, snapshot: PlanSnapshot, event: PlanEvent): PlanSnapshot {
  return planningStore.appendEvent({
    planId: snapshot.id,
    expectedRevision: snapshot.revision,
    event,
  });
}

function getRequiredPlanSnapshot(planningStore: PlanningStore, planId: string): PlanSnapshot {
  const snapshot = planningStore.getPlanSnapshot(planId);
  if (!snapshot) {
    throw new Error(`Unknown plan: ${planId}`);
  }
  return snapshot;
}

function assertDiscussComplete(snapshot: PlanSnapshot): void {
  const complete = discussStageOrder.every((stage) => getDiscussStageProgress(snapshot, stage).depthConfirmed);
  if (!complete) {
    throw new Error("DISCUSS must be confirmed before research can start");
  }
}

function advanceDiscussStageAfterAnswer(
  planningStore: PlanningStore,
  snapshot: PlanSnapshot,
  stage: DiscussStage,
): PlanSnapshot {
  const nextQuestion = getNextUnansweredQuestion(snapshot, stage);
  if (nextQuestion) {
    return appendEvent(planningStore, snapshot, {
      type: "stage.updated",
      stage,
      status: "active",
      activeQuestionId: nextQuestion.id,
    });
  }

  return appendEvent(planningStore, snapshot, {
    type: "stage.updated",
    stage,
    status: "needs-review",
    activeQuestionId: "",
  });
}

function resolveSelectedPlanId(
  plans: readonly { readonly id: string; readonly updatedAt: string }[],
  preferredPlanId: string | undefined,
): string {
  if (preferredPlanId && plans.some((plan) => plan.id === preferredPlanId)) {
    return preferredPlanId;
  }
  return [...plans].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]?.id ?? "";
}

function publishCurrentPlanningState(
  store: AppStoreInternals,
  planningStore: PlanningStore,
  workspaceId: string,
  workspacePath: string,
  selectedPlan: PlanSnapshot | undefined,
): Promise<DesktopAppState> {
  return publishPlanningState(store, workspaceId, workspacePath, planningStore.listPlans(), selectedPlan, {
    activeView: "plans",
  });
}

async function publishPlanningState(
  store: AppStoreInternals,
  workspaceId: string,
  workspacePath: string,
  plans: readonly PlanListEntry[],
  selectedPlan: PlanSnapshot | undefined,
  options: { readonly activeView?: "plans" } = {},
): Promise<DesktopAppState> {
  const planningState: WorkspacePlanningState = {
    workspaceId,
    selectedPlanId: selectedPlan?.id ?? "",
    plans,
    ...(selectedPlan ? { selectedPlan } : {}),
    databasePath: planningDatabasePath(workspacePath),
    loadedAt: new Date().toISOString(),
  };

  store.state = {
    ...store.state,
    planningByWorkspace: {
      ...store.state.planningByWorkspace,
      [workspaceId]: planningState,
    },
    ...(options.activeView ? { activeView: options.activeView } : {}),
    lastError: undefined,
    revision: store.state.revision + 1,
  };
  await store.persistUiState();
  return store.emit();
}
