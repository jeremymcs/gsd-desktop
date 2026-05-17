import {
  openPlanningStore,
  planningDatabasePath,
  ProjectionWriteConflictError,
  regenerateProjections,
  type PlanEvent,
  type PlanListEntry,
  type PlanSnapshot,
  type PlanningStore,
} from "@pi-gui/gsd-planning";
import { sessionKey } from "@pi-gui/pi-sdk-driver";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import type {
  ConfirmPlanningStageInput,
  CreatePlanningPlanInput,
  DesktopAppState,
  LinkPlanningTaskSessionInput,
  PlanningProjectionSummary,
  ProposePlanningPlanInput,
  ProposePlanningResearchInput,
  RecordPlanningAnswerInput,
  RecordPlanningShipSummaryInput,
  RecordPlanningTaskVerificationInput,
  RegeneratePlanningProjectionsInput,
  ReviewPlanningPlanInput,
  ReviewPlanningResearchInput,
  RevisePlanningAnswerInput,
  SelectPlanningPlanInput,
  StartPlanningExecutionInput,
  StartPlanningPlanInput,
  StartPlanningResearchInput,
  StartPlanningShipInput,
  StartPlanningVerifyInput,
  UpdatePlanningTaskExecutionInput,
  WorkspacePlanningState,
} from "../src/desktop-state";
import {
  parsePlanProposal,
  serializePlanProposal,
  validatePlanProposal,
} from "../src/plan-builder-plan";
import { buildPlanningProjectionInput } from "../src/plan-builder-projections";
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

export async function startPlanningPlan(
  store: AppStoreInternals,
  input: StartPlanningPlanInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      assertAcceptedResearch(snapshot);

      const roadmapStage = snapshot.stages.find((entry) => entry.stage === "roadmap");
      const planAlreadyStarted =
        roadmapStage?.status === "active" ||
        roadmapStage?.status === "needs-review" ||
        roadmapStage?.status === "approved";
      if (planAlreadyStarted) {
        return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
      }

      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "stage.updated",
          stage: "roadmap",
          status: "active",
          activeQuestionId: "",
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function proposePlanningPlan(
  store: AppStoreInternals,
  input: ProposePlanningPlanInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      assertAcceptedResearch(snapshot);
      const validationIssues = validatePlanProposal(input.proposal);

      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "generated-output.proposed",
          output: {
            id: randomUUID(),
            stage: "roadmap",
            title: "Plan proposal",
            content: serializePlanProposal(input.proposal),
            status: validationIssues.length > 0 ? "draft" : "proposed",
          },
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "stage.updated",
        stage: "roadmap",
        status: validationIssues.length > 0 ? "active" : "needs-review",
        activeQuestionId: "",
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function reviewPlanningPlan(
  store: AppStoreInternals,
  input: ReviewPlanningPlanInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, async (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      const output = snapshot.generatedOutputs.find((entry) => entry.id === input.outputId);
      if (!output || output.stage !== "roadmap") {
        throw new Error(`Unknown plan proposal: ${input.outputId}`);
      }

      if (input.status === "accepted") {
        const proposal = parsePlanProposal(output.content);
        const validationIssues = proposal ? validatePlanProposal(proposal) : [
          { id: "plan-output", path: output.title, message: "Plan proposal content is invalid." },
        ];
        if (validationIssues.length > 0) {
          throw new Error(`Plan approval blocked: ${validationIssues[0]?.message ?? "Validation failed."}`);
        }
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
        stage: "roadmap",
        status: snapshot.generatedOutputs.some((entry) => entry.stage === "roadmap" && entry.status === "accepted")
          ? "approved"
          : "active",
        activeQuestionId: "",
      });

      const projectionSummary =
        input.status === "accepted" ? await writePlanningProjections(workspace.path, snapshot) : undefined;

      return publishCurrentPlanningState(
        store,
        planningStore,
        workspace.id,
        workspace.path,
        snapshot,
        projectionSummary ? { projectionSummary } : {},
      );
    });
  });
}

export async function startPlanningExecution(
  store: AppStoreInternals,
  input: StartPlanningExecutionInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      assertAcceptedPlan(snapshot);

      if (snapshot.activePhase === "execute") {
        return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
      }

      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "phase.updated",
          phase: "execute",
          stage: "task",
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function linkPlanningTaskSession(
  store: AppStoreInternals,
  input: LinkPlanningTaskSessionInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }
  const workspaceRef = store.workspaceRefFromState(workspace.id);
  if (!workspaceRef) {
    return store.withError(`Unknown workspace: ${workspace.id}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, async (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      assertAcceptedPlan(snapshot);
      assertAcceptedPlanTask(snapshot, input.taskId, input.taskPath);
      if (snapshot.activePhase !== "execute") {
        throw new Error("EXECUTE must be active before linking a task session");
      }

      const existingLink = snapshot.taskSessionLinks.find((link) => link.taskId === input.taskId);
      if (existingLink) {
        return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
      }

      const createOptions = (await store.buildCreateSessionOptions(workspace.id)) ?? {};
      const session = await store.driver.createSession(workspaceRef, {
        ...createOptions,
        title: buildTaskSessionTitle(input),
      });
      const key = sessionKey(session.ref);
      store.sessionState.transcriptCache.set(key, []);
      store.sessionState.loadedTranscriptKeys.add(key);
      store.updateSessionConfig(session.ref, session.config);
      await store.refreshState({
        selectedWorkspaceId: store.state.selectedWorkspaceId,
        selectedSessionId: store.state.selectedSessionId,
        clearLastError: true,
        activeView: "plans",
        hydrateSelectedSession: false,
      });

      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "task.session-linked",
          link: {
            taskId: input.taskId,
            taskPath: input.taskPath,
            workspaceId: session.ref.workspaceId,
            sessionId: session.ref.sessionId,
            title: buildTaskSessionTitle(input),
          },
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function updatePlanningTaskExecution(
  store: AppStoreInternals,
  input: UpdatePlanningTaskExecutionInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      assertAcceptedPlan(snapshot);
      assertAcceptedPlanTask(snapshot, input.taskId, input.taskPath);
      if (snapshot.activePhase !== "execute") {
        throw new Error("EXECUTE must be active before updating a task");
      }

      const note = input.note.trim();
      const blocker = input.status === "blocked" ? input.blocker.trim() : "";
      const evidence = input.evidence.trim();
      const currentTask = snapshot.taskExecutions.find((entry) => entry.taskId === input.taskId);
      if (input.status === "blocked" && !blocker) {
        throw new Error("Blocked tasks need a blocker");
      }
      if (input.status === "done" && !evidence && !currentTask?.evidence.length) {
        throw new Error("Evidence is required before marking a task done");
      }

      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "task.status-updated",
          task: {
            taskId: input.taskId,
            taskPath: input.taskPath,
            status: input.status,
            note,
            blocker,
          },
        },
      });

      if (evidence) {
        snapshot = appendEvent(planningStore, snapshot, {
          type: "task.evidence-recorded",
          evidence: {
            taskId: input.taskId,
            taskPath: input.taskPath,
            text: evidence,
          },
        });
      }

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function startPlanningVerify(
  store: AppStoreInternals,
  input: StartPlanningVerifyInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      assertAcceptedPlan(snapshot);
      assertReadyForVerify(snapshot);

      if (snapshot.activePhase === "verify") {
        return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
      }
      if (snapshot.activePhase !== "execute") {
        throw new Error("EXECUTE must be active before VERIFY can start");
      }

      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "phase.updated",
          phase: "verify",
          stage: "task",
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function recordPlanningTaskVerification(
  store: AppStoreInternals,
  input: RecordPlanningTaskVerificationInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      const snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      assertAcceptedPlan(snapshot);
      const acceptedTask = assertAcceptedPlanTask(snapshot, input.taskId, input.taskPath);
      assertTaskReadyForVerification(snapshot, input.taskId);
      if (snapshot.activePhase !== "verify") {
        throw new Error("VERIFY must be active before recording task verification");
      }

      const note = input.note.trim();
      if (input.status === "failed" && !note) {
        throw new Error("Failed verification needs a note");
      }

      const updated = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "task.verification-recorded",
          verification: {
            taskId: input.taskId,
            taskPath: input.taskPath,
            acceptance: acceptedTask.acceptance.trim(),
            status: input.status,
            note,
          },
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, updated);
    });
  });
}

export async function startPlanningShip(
  store: AppStoreInternals,
  input: StartPlanningShipInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      assertAcceptedPlan(snapshot);
      assertReadyForShip(snapshot);

      if (snapshot.activePhase === "ship") {
        return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
      }
      if (snapshot.activePhase !== "verify") {
        throw new Error("VERIFY must be active before SHIP can start");
      }

      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "phase.updated",
          phase: "ship",
          stage: "task",
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function recordPlanningShipSummary(
  store: AppStoreInternals,
  input: RecordPlanningShipSummaryInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      const snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      assertAcceptedPlan(snapshot);
      assertReadyForShip(snapshot);
      if (snapshot.activePhase !== "ship") {
        throw new Error("SHIP must be active before recording a ship summary");
      }

      const summary = input.summary.trim();
      if (!summary) {
        throw new Error("Ship summary is required");
      }

      const updated = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "ship.summary-recorded",
          summary: {
            summary,
          },
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, updated);
    });
  });
}

export async function regeneratePlanningProjectionsForPlan(
  store: AppStoreInternals,
  input: RegeneratePlanningProjectionsInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, async (planningStore) => {
      const snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      const projectionSummary = await writePlanningProjections(
        workspace.path,
        snapshot,
        input.allowLegacyOverwrite,
      );
      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot, {
        projectionSummary,
      });
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

function assertAcceptedResearch(snapshot: PlanSnapshot): void {
  const hasAcceptedResearch = snapshot.generatedOutputs.some(
    (output) => output.stage === "research" && output.status === "accepted",
  );
  if (!hasAcceptedResearch) {
    throw new Error("Accepted RESEARCH is required before PLAN can start");
  }
}

function assertAcceptedPlan(snapshot: PlanSnapshot): void {
  const acceptedPlan = snapshot.generatedOutputs.find(
    (output) => output.stage === "roadmap" && output.status === "accepted",
  );
  if (!acceptedPlan) {
    throw new Error("Accepted PLAN is required before EXECUTE can start");
  }
  const proposal = parsePlanProposal(acceptedPlan.content);
  const validationIssues = proposal ? validatePlanProposal(proposal) : [
    { id: "plan-output", path: acceptedPlan.title, message: "Plan proposal content is invalid." },
  ];
  if (validationIssues.length > 0) {
    throw new Error(`EXECUTE blocked: ${validationIssues[0]?.message ?? "Plan validation failed."}`);
  }
}

function assertAcceptedPlanTask(
  snapshot: PlanSnapshot,
  taskId: string,
  taskPath: string,
): { readonly taskId: string; readonly taskPath: string; readonly acceptance: string } {
  const task = getAcceptedPlanTasks(snapshot).find((entry) => entry.taskId === taskId && entry.taskPath === taskPath);
  if (!task) {
    throw new Error(`Task ${taskId} is not part of the accepted PLAN`);
  }
  return task;
}

function assertReadyForVerify(snapshot: PlanSnapshot): void {
  for (const task of getAcceptedPlanTasks(snapshot)) {
    assertTaskReadyForVerification(snapshot, task.taskId);
  }
}

function assertReadyForShip(snapshot: PlanSnapshot): void {
  const acceptedTasks = getAcceptedPlanTasks(snapshot);
  if (acceptedTasks.length === 0) {
    throw new Error("SHIP blocked: accepted PLAN has no tasks");
  }
  for (const task of acceptedTasks) {
    const verification = snapshot.taskVerifications.find((entry) => entry.taskId === task.taskId);
    if (verification?.status !== "passed") {
      throw new Error(`SHIP blocked: ${task.taskId} needs passed verification`);
    }
  }
}

function assertTaskReadyForVerification(snapshot: PlanSnapshot, taskId: string): void {
  const execution = snapshot.taskExecutions.find((entry) => entry.taskId === taskId);
  if (execution?.status !== "done" || execution.evidence.length === 0) {
    throw new Error(`VERIFY blocked: ${taskId} needs done status and evidence`);
  }
}

function getAcceptedPlanTasks(
  snapshot: PlanSnapshot,
): readonly { readonly taskId: string; readonly taskPath: string; readonly acceptance: string }[] {
  const acceptedPlan = snapshot.generatedOutputs.find(
    (output) => output.stage === "roadmap" && output.status === "accepted",
  );
  const proposal = acceptedPlan ? parsePlanProposal(acceptedPlan.content) : undefined;
  return proposal
    ? proposal.milestones.flatMap((milestone) =>
        milestone.slices.flatMap((slice) =>
          slice.tasks.map((task) => ({
            taskId: task.id,
            taskPath: `${milestone.id}/${slice.id}/${task.id}`,
            acceptance: task.acceptance,
          })),
        ),
      )
    : [];
}

function buildTaskSessionTitle(input: LinkPlanningTaskSessionInput): string {
  const taskTitle = input.taskTitle.trim();
  const title = taskTitle ? `Task ${input.taskId} - ${taskTitle}` : `Task ${input.taskId}`;
  return title.length > 90 ? `${title.slice(0, 87)}...` : title;
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

async function writePlanningProjections(
  workspacePath: string,
  snapshot: PlanSnapshot,
  allowLegacyOverwrite?: boolean,
): Promise<PlanningProjectionSummary> {
  const generatedAt = new Date().toISOString();
  try {
    const result = await regenerateProjections({
      workspaceRoot: workspacePath,
      projectionInput: buildPlanningProjectionInput(snapshot, generatedAt),
      ...(allowLegacyOverwrite !== undefined ? { allowLegacyOverwrite } : {}),
    });

    return {
      generatedAt,
      written: result.written.length,
      skipped: result.skipped.length,
      conflicts: result.conflicts.map((conflict) => conflict.path),
    };
  } catch (error) {
    if (error instanceof ProjectionWriteConflictError) {
      return {
        generatedAt,
        written: 0,
        skipped: 0,
        conflicts: error.conflicts.map((conflict) => conflict.path),
      };
    }
    throw error;
  }
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
  options: { readonly projectionSummary?: PlanningProjectionSummary } = {},
): Promise<DesktopAppState> {
  return publishPlanningState(store, workspaceId, workspacePath, planningStore.listPlans(), selectedPlan, {
    activeView: "plans",
    ...(options.projectionSummary ? { projectionSummary: options.projectionSummary } : {}),
  });
}

async function publishPlanningState(
  store: AppStoreInternals,
  workspaceId: string,
  workspacePath: string,
  plans: readonly PlanListEntry[],
  selectedPlan: PlanSnapshot | undefined,
  options: { readonly activeView?: "plans"; readonly projectionSummary?: PlanningProjectionSummary } = {},
): Promise<DesktopAppState> {
  const planningState: WorkspacePlanningState = {
    workspaceId,
    selectedPlanId: selectedPlan?.id ?? "",
    plans,
    ...(selectedPlan ? { selectedPlan } : {}),
    databasePath: planningDatabasePath(workspacePath),
    ...(options.projectionSummary ? { projectionSummary: options.projectionSummary } : {}),
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
