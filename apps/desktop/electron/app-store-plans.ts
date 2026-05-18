import {
  openPlanningStore,
  planningDatabasePath,
  compareGeneratedProjections,
  ProjectionWriteConflictError,
  regenerateProjections,
  writeWorkflowPreferenceFiles,
  defaultWorkflowAutonomousRunPolicy,
  normalizeWorkflowAutonomousRunPolicy,
  type ApprovedPlanInjectionRecord,
  type PlanEvent,
  type PlanListEntry,
  type PlanSnapshot,
  type PlanningStore,
  type RequirementRecord,
  type TaskSessionLinkExecutionModelRecord,
  type WorkflowPreferencesRecord,
} from "@pi-gui/gsd-planning";
import {
  normalizeWorkflowPhaseModelPreferences,
  resolveWorkflowPhaseModel,
  workflowPhaseModelSourceLabel,
  workflowPhaseModelValueLabel,
  type ResolvedWorkflowPhaseModel,
} from "../src/planning-phase-models";
import { sessionKey } from "@pi-gui/pi-sdk-driver";
import type { CreateSessionOptions } from "@pi-gui/session-driver";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import type {
  ApplyPlanningWorkflowPreferencesInput,
  ApprovePlanningChangeProposalInput,
  ApprovePlanningTaskModificationInput,
  ConfirmPlanningStageInput,
  CreatePlanningPlanInput,
  DesktopAppState,
  DraftPlanningChangeProposalInput,
  HidePlanningTaskInput,
  LinkPlanningTaskSessionInput,
  ParkPlanningIdeaInput,
  PlanningMilestoneDraft,
  PlanningPlanProposalDraft,
  PlanningSliceDraft,
  PlanningTaskDraft,
  PlanningProjectionSummary,
  ProposePlanningPlanInput,
  ProposePlanningResearchInput,
  RecordPlanningAnswerInput,
  RecordPlanningShipSummaryInput,
  RecordPlanningTaskVerificationInput,
  RegeneratePlanningProjectionsInput,
  ReviewPlanningIdeaInput,
  ReviewPlanningPlanInput,
  ReviewPlanningResearchInput,
  RestorePlanningTaskInput,
  RevisePlanningAnswerInput,
  SelectPlanningPlanInput,
  StartPlanningExecutionInput,
  StartPlanningPlanInput,
  StartPlanningResearchInput,
  StartPlanningShipInput,
  StartPlanningVerifyInput,
  UpdatePlanningChangeProposalInput,
  UpdatePlanningIdeaInput,
  UpdatePlanningWorkflowPreferencesInput,
  UpdatePlanningTaskExecutionInput,
  UpsertPlanningRequirementsInput,
  WithdrawPlanningChangeProposalInput,
  WorkspacePlanningState,
} from "../src/desktop-state";
import {
  parsePlanProposal,
  serializePlanProposal,
  validatePlanProposal,
} from "../src/plan-builder-plan";
import { buildPlanningProjectionInput } from "../src/plan-builder-projections";
import { buildRequirementDrafts } from "../src/plan-builder-requirements";
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

export async function applyPlanningWorkflowPreferences(
  store: AppStoreInternals,
  input: ApplyPlanningWorkflowPreferencesInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, async (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      if (!snapshot.workflowPreferences) {
        snapshot = planningStore.appendEvent({
          planId: input.planId,
          expectedRevision: input.expectedRevision,
          event: {
            type: "workflow.preferences-updated",
            preferences: defaultWorkflowPreferences(),
          },
        });
      }

      await writeWorkflowPreferenceFiles({ workspaceRoot: workspace.path, plan: snapshot });
      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function updatePlanningWorkflowPreferences(
  store: AppStoreInternals,
  input: UpdatePlanningWorkflowPreferencesInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, async (planningStore) => {
      const snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "workflow.preferences-updated",
          preferences: normalizeWorkflowPreferences(input.preferences),
        },
      });

      await writeWorkflowPreferenceFiles({ workspaceRoot: workspace.path, plan: snapshot });
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
      const answerId = randomUUID();
      let snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "answer.recorded",
          answer: {
            id: answerId,
            stage,
            questionId: input.questionId,
            prompt: input.prompt,
            answer: input.answer,
            loadBearing: input.loadBearing,
            ...(input.discretionRationale ? { discretionRationale: input.discretionRationale } : {}),
          },
        },
      });

      if (!input.loadBearing) {
        snapshot = appendEvent(planningStore, snapshot, {
          type: "idea.parked",
          item: {
            sourceType: "answer",
            sourceAnswerId: answerId,
            sourceStage: stage,
            sourceQuestionId: input.questionId,
            sourcePrompt: input.prompt,
            text: input.answer,
            rationale: input.discretionRationale ?? "Parked for later review",
          },
        });
      }

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

export async function parkPlanningIdea(
  store: AppStoreInternals,
  input: ParkPlanningIdeaInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  const text = input.text.trim();
  if (!text) {
    return store.withError("Parked ideas need text");
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      const snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "idea.parked",
          item: {
            sourceType: "composer",
            sourceStage: input.sourceStage,
            sourceQuestionId: input.sourceQuestionId.trim() || "composer_note",
            sourcePrompt: input.sourcePrompt.trim() || "Composer note",
            text,
            rationale: input.rationale?.trim() || "Parked from the Plan Builder composer",
          },
        },
      });

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

export async function upsertPlanningRequirements(
  store: AppStoreInternals,
  input: UpsertPlanningRequirementsInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  const [firstRequirement, ...remainingRequirements] = input.requirements.map(normalizeRequirement);
  if (!firstRequirement) {
    return store.withError("At least one requirement is required");
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      const current = getRequiredPlanSnapshot(planningStore, input.planId);
      const previousPosition = {
        phase: current.activePhase,
        stage: current.activeStage,
      };
      let snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "requirement.upserted",
          requirement: firstRequirement,
        },
      });

      for (const requirement of remainingRequirements) {
        snapshot = appendEvent(planningStore, snapshot, {
          type: "requirement.upserted",
          requirement,
        });
      }

      if (snapshot.activePhase !== previousPosition.phase || snapshot.activeStage !== previousPosition.stage) {
        snapshot = appendEvent(planningStore, snapshot, {
          type: "phase.updated",
          phase: previousPosition.phase,
          stage: previousPosition.stage,
        });
      }

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function reviewPlanningIdea(
  store: AppStoreInternals,
  input: ReviewPlanningIdeaInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      const current = planningStore.getPlanSnapshot(input.planId);
      if (!current) {
        throw new Error(`Unknown plan: ${input.planId}`);
      }
      if (!current.parkedItems.some((item) => item.id === input.itemId)) {
        throw new Error(`Unknown parked idea: ${input.itemId}`);
      }

      const snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "idea.reviewed",
          itemId: input.itemId,
          status: input.status,
          ...(input.note ? { note: input.note } : {}),
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function updatePlanningIdea(
  store: AppStoreInternals,
  input: UpdatePlanningIdeaInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  const text = input.text.trim();
  if (!text) {
    return store.withError("Parked ideas need text");
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      const current = getRequiredPlanSnapshot(planningStore, input.planId);
      const item = current.parkedItems.find((entry) => entry.id === input.itemId);
      if (!item) {
        throw new Error(`Unknown parked idea: ${input.itemId}`);
      }

      const snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "idea.updated",
          itemId: item.id,
          text,
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function draftPlanningChangeProposal(
  store: AppStoreInternals,
  input: DraftPlanningChangeProposalInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  const title = input.title.trim();
  const summary = input.summary.trim();
  const impactNotes = input.impactNotes.trim();
  if (!title || !summary || !impactNotes) {
    return store.withError("Change proposal title, summary, and impact notes are required");
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      const current = getRequiredPlanSnapshot(planningStore, input.planId);
      const source = current.parkedItems.find((item) => item.id === input.sourceParkedItemId);
      if (!source) {
        throw new Error(`Unknown parked idea: ${input.sourceParkedItemId}`);
      }
      if (source.reviewStatus !== "promotion-ready") {
        throw new Error("Only ideas prepared for promotion can draft a change proposal");
      }
      if (
        current.changeProposals.some(
          (proposal) => proposal.sourceParkedItemId === source.id && proposal.status !== "withdrawn",
        )
      ) {
        throw new Error("A change proposal already exists for this idea");
      }

      const snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "change.proposal-drafted",
          proposal: {
            sourceType: "parked-item",
            sourceParkedItemId: source.id,
            title,
            summary,
            impactNotes,
          },
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function withdrawPlanningChangeProposal(
  store: AppStoreInternals,
  input: WithdrawPlanningChangeProposalInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      const current = getRequiredPlanSnapshot(planningStore, input.planId);
      const proposal = current.changeProposals.find((entry) => entry.id === input.proposalId);
      if (!proposal) {
        throw new Error(`Unknown change proposal: ${input.proposalId}`);
      }
      if (proposal.status !== "draft") {
        throw new Error("Only draft change proposals can be deleted");
      }

      const snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "change.proposal-withdrawn",
          proposalId: proposal.id,
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function updatePlanningChangeProposal(
  store: AppStoreInternals,
  input: UpdatePlanningChangeProposalInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  const title = input.title.trim();
  const summary = input.summary.trim();
  const impactNotes = input.impactNotes.trim();
  if (!title || !summary || !impactNotes) {
    return store.withError("Change proposal title, summary, and impact notes are required");
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, (planningStore) => {
      const current = getRequiredPlanSnapshot(planningStore, input.planId);
      const proposal = current.changeProposals.find((entry) => entry.id === input.proposalId);
      if (!proposal) {
        throw new Error(`Unknown change proposal: ${input.proposalId}`);
      }
      if (proposal.status !== "draft") {
        throw new Error("Only draft change proposals can be edited");
      }

      const snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "change.proposal-updated",
          proposalId: proposal.id,
          title,
          summary,
          impactNotes,
        },
      });

      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
    });
  });
}

export async function approvePlanningChangeProposal(
  store: AppStoreInternals,
  input: ApprovePlanningChangeProposalInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  const targetMilestoneId = input.targetMilestoneId.trim();
  const targetSliceId = input.targetSliceId.trim();
  const task: PlanningTaskDraft = {
    id: input.taskId.trim(),
    title: input.taskTitle.trim(),
    acceptance: input.taskAcceptance.trim(),
    dependencies: input.dependencies.map((dependency) => dependency.trim()).filter(Boolean),
    requirementIds: [],
  };
  if (!targetMilestoneId || !targetSliceId || !task.id || !task.title || !task.acceptance) {
    return store.withError("Approved changes need a target slice, task id, title, and acceptance");
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, async (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      const proposal = snapshot.changeProposals.find((entry) => entry.id === input.proposalId);
      if (!proposal) {
        throw new Error(`Unknown change proposal: ${input.proposalId}`);
      }
      if (proposal.status !== "draft") {
        throw new Error("Only draft change proposals can be approved");
      }

      const acceptedOutput = getLatestAcceptedPlanOutput(snapshot);
      if (!acceptedOutput) {
        throw new Error("Accepted PLAN is required before approving a change proposal");
      }
      const acceptedPlan = parsePlanProposal(acceptedOutput.content);
      if (!acceptedPlan) {
        throw new Error("Accepted PLAN content is invalid and cannot receive approved changes");
      }

      const nextPlan = injectTaskIntoAcceptedPlan(acceptedPlan, targetMilestoneId, targetSliceId, task);
      const validationIssues = validatePlanProposal(nextPlan, getPlanningRequirementRows(snapshot));
      if (validationIssues.length > 0) {
        throw new Error(`Change approval blocked: ${validationIssues[0]?.message ?? "Validation failed."}`);
      }

      const outputId = randomUUID();
      const taskPath = `${targetMilestoneId}/${targetSliceId}/${task.id}`;
      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "change.proposal-approved",
          proposalId: proposal.id,
          injection: {
            changeProposalId: proposal.id,
            sourceParkedItemId: proposal.sourceParkedItemId,
            acceptedOutputId: outputId,
            targetMilestoneId,
            targetSliceId,
            taskId: task.id,
            taskPath,
            title: task.title,
            acceptance: task.acceptance,
            dependencies: task.dependencies,
          },
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "generated-output.proposed",
        output: {
          id: outputId,
          stage: "roadmap",
          title: `Approved change - ${proposal.title}`,
          content: serializePlanProposal(nextPlan),
          status: "proposed",
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "generated-output.reviewed",
        outputId,
        status: "accepted",
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "stage.updated",
        stage: "roadmap",
        status: "approved",
        activeQuestionId: "",
      });

      const projectionSummary = await writePlanningProjections(workspace.path, snapshot);
      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot, {
        projectionSummary,
      });
    });
  });
}

export async function approvePlanningTaskModification(
  store: AppStoreInternals,
  input: ApprovePlanningTaskModificationInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  const taskPath = input.taskPath.trim();
  const taskTitle = input.taskTitle.trim();
  const taskAcceptance = input.taskAcceptance.trim();
  const dependencies = input.dependencies.map((dependency) => dependency.trim()).filter(Boolean);
  if (!taskPath || !taskTitle || !taskAcceptance) {
    return store.withError("Task modifications need a target task, title, and acceptance");
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, async (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      const previousPosition = {
        phase: snapshot.activePhase,
        stage: snapshot.activeStage,
      };
      const proposal = snapshot.changeProposals.find((entry) => entry.id === input.proposalId);
      if (!proposal) {
        throw new Error(`Unknown change proposal: ${input.proposalId}`);
      }
      if (proposal.status !== "draft") {
        throw new Error("Only draft change proposals can be approved");
      }

      const acceptedOutput = getLatestAcceptedPlanOutput(snapshot);
      if (!acceptedOutput) {
        throw new Error("Accepted PLAN is required before modifying a task");
      }
      const acceptedPlan = parsePlanProposal(acceptedOutput.content);
      if (!acceptedPlan) {
        throw new Error("Accepted PLAN content is invalid and cannot receive modifications");
      }

      const modified = modifyTaskInAcceptedPlan(acceptedPlan, taskPath, {
        title: taskTitle,
        acceptance: taskAcceptance,
        dependencies,
      });
      const validationIssues = validatePlanProposal(modified.proposal, getPlanningRequirementRows(snapshot));
      if (validationIssues.length > 0) {
        throw new Error(`Task modification blocked: ${validationIssues[0]?.message ?? "Validation failed."}`);
      }

      const outputId = randomUUID();
      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "change.proposal-modification-approved",
          proposalId: proposal.id,
          modification: {
            changeProposalId: proposal.id,
            sourceParkedItemId: proposal.sourceParkedItemId,
            acceptedOutputId: outputId,
            targetMilestoneId: modified.targetMilestoneId,
            targetSliceId: modified.targetSliceId,
            taskId: modified.task.id,
            taskPath,
            previousTitle: modified.previousTask.title,
            title: modified.task.title,
            previousAcceptance: modified.previousTask.acceptance,
            acceptance: modified.task.acceptance,
            previousDependencies: modified.previousTask.dependencies,
            dependencies: modified.task.dependencies,
          },
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "generated-output.proposed",
        output: {
          id: outputId,
          stage: "roadmap",
          title: `Modified task - ${taskPath}`,
          content: serializePlanProposal(modified.proposal),
          status: "proposed",
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "generated-output.reviewed",
        outputId,
        status: "accepted",
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "stage.updated",
        stage: "roadmap",
        status: "approved",
        activeQuestionId: "",
      });
      if (previousPosition.phase !== "plan" || previousPosition.stage !== "roadmap") {
        snapshot = appendEvent(planningStore, snapshot, {
          type: "phase.updated",
          phase: previousPosition.phase,
          stage: previousPosition.stage,
        });
      }

      const projectionSummary = await writePlanningProjections(workspace.path, snapshot);
      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot, {
        projectionSummary,
      });
    });
  });
}

export async function hidePlanningTask(
  store: AppStoreInternals,
  input: HidePlanningTaskInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  const taskPath = input.taskPath.trim();
  const reason = input.reason.trim();
  if (!taskPath || !reason) {
    return store.withError("Hidden tasks need a task path and reason");
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, async (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      const previousPosition = {
        phase: snapshot.activePhase,
        stage: snapshot.activeStage,
      };
      const acceptedOutput = getLatestAcceptedPlanOutput(snapshot);
      if (!acceptedOutput) {
        throw new Error("Accepted PLAN is required before hiding a task");
      }
      const acceptedPlan = parsePlanProposal(acceptedOutput.content);
      if (!acceptedPlan) {
        throw new Error("Accepted PLAN content is invalid and cannot hide tasks");
      }

      const hidden = hideTaskFromAcceptedPlan(acceptedPlan, taskPath);
      const validationIssues = validatePlanProposal(hidden.proposal, getPlanningRequirementRows(snapshot));
      if (validationIssues.length > 0) {
        throw new Error(`Task removal blocked: ${validationIssues[0]?.message ?? "Validation failed."}`);
      }

      const outputId = randomUUID();
      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "plan.item-hidden",
          item: {
            targetType: "task",
            targetId: hidden.task.id,
            targetPath: taskPath,
            reason,
            acceptedOutputId: outputId,
          },
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "generated-output.proposed",
        output: {
          id: outputId,
          stage: "roadmap",
          title: `Hidden task - ${taskPath}`,
          content: serializePlanProposal(hidden.proposal),
          status: "proposed",
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "generated-output.reviewed",
        outputId,
        status: "accepted",
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "stage.updated",
        stage: "roadmap",
        status: "approved",
        activeQuestionId: "",
      });
      if (previousPosition.phase !== "plan" || previousPosition.stage !== "roadmap") {
        snapshot = appendEvent(planningStore, snapshot, {
          type: "phase.updated",
          phase: previousPosition.phase,
          stage: previousPosition.stage,
        });
      }

      const projectionSummary = await writePlanningProjections(workspace.path, snapshot);
      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot, {
        projectionSummary,
      });
    });
  });
}

export async function restorePlanningTask(
  store: AppStoreInternals,
  input: RestorePlanningTaskInput,
): Promise<DesktopAppState> {
  await store.initialize();
  const workspace = resolvePlanningWorkspace(store, input.workspaceId);
  if (!workspace) {
    return store.withError(`Unknown workspace: ${input.workspaceId}`);
  }

  const taskPath = input.taskPath.trim();
  if (!taskPath) {
    return store.withError("Restored tasks need a task path");
  }

  return store.withErrorHandling(async () => {
    return withPlanningStore(workspace.path, async (planningStore) => {
      let snapshot = getRequiredPlanSnapshot(planningStore, input.planId);
      const previousPosition = {
        phase: snapshot.activePhase,
        stage: snapshot.activeStage,
      };
      const hiddenItem = snapshot.hiddenPlanItems.find((item) => item.targetPath === taskPath);
      if (!hiddenItem) {
        throw new Error(`Task ${taskPath} is not hidden`);
      }
      const injection = snapshot.approvedInjections.find((entry) => entry.taskPath === taskPath);
      if (!injection) {
        throw new Error(`Task ${taskPath} cannot be restored because it is not an approved injected task`);
      }

      const acceptedOutput = getLatestAcceptedPlanOutput(snapshot);
      if (!acceptedOutput) {
        throw new Error("Accepted PLAN is required before restoring a task");
      }
      const acceptedPlan = parsePlanProposal(acceptedOutput.content);
      if (!acceptedPlan) {
        throw new Error("Accepted PLAN content is invalid and cannot restore tasks");
      }

      const restored = restoreTaskToAcceptedPlan(acceptedPlan, injection);
      const validationIssues = validatePlanProposal(restored, getPlanningRequirementRows(snapshot));
      if (validationIssues.length > 0) {
        throw new Error(`Task restore blocked: ${validationIssues[0]?.message ?? "Validation failed."}`);
      }

      const outputId = randomUUID();
      snapshot = planningStore.appendEvent({
        planId: input.planId,
        expectedRevision: input.expectedRevision,
        event: {
          type: "plan.item-restored",
          itemId: hiddenItem.id,
          targetPath: taskPath,
          acceptedOutputId: outputId,
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "generated-output.proposed",
        output: {
          id: outputId,
          stage: "roadmap",
          title: `Restored task - ${taskPath}`,
          content: serializePlanProposal(restored),
          status: "proposed",
        },
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "generated-output.reviewed",
        outputId,
        status: "accepted",
      });
      snapshot = appendEvent(planningStore, snapshot, {
        type: "stage.updated",
        stage: "roadmap",
        status: "approved",
        activeQuestionId: "",
      });
      if (previousPosition.phase !== "plan" || previousPosition.stage !== "roadmap") {
        snapshot = appendEvent(planningStore, snapshot, {
          type: "phase.updated",
          phase: previousPosition.phase,
          stage: previousPosition.stage,
        });
      }

      const projectionSummary = await writePlanningProjections(workspace.path, snapshot);
      return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot, {
        projectionSummary,
      });
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
      const validationIssues = validatePlanProposal(input.proposal, getPlanningRequirementRows(snapshot));

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
        const validationIssues = proposal ? validatePlanProposal(proposal, getPlanningRequirementRows(snapshot)) : [
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
      const taskContext = getAcceptedPlanTaskContext(snapshot, input.taskId, input.taskPath);
      if (snapshot.activePhase !== "execute") {
        throw new Error("EXECUTE must be active before linking a task session");
      }

      const existingLink = snapshot.taskSessionLinks.find((link) => link.taskId === input.taskId);
      if (existingLink) {
        return publishCurrentPlanningState(store, planningStore, workspace.id, workspace.path, snapshot);
      }

      const createOptions = (await store.buildCreateSessionOptions(workspace.id)) ?? {};
      const executionModel = resolveWorkflowPhaseModel({
        phase: "execute",
        projectOverrides: snapshot.workflowPreferences?.models.phaseOverrides,
        globalPhaseModels: store.state.globalPlanningPreferences.phaseModels,
        sessionDefault: createOptions.initialModel
          ? { providerId: createOptions.initialModel.provider, modelId: createOptions.initialModel.modelId }
          : undefined,
      });
      const session = await store.driver.createSession(workspaceRef, {
        ...createOptionsWithResolvedModel(createOptions, executionModel),
        title: buildTaskSessionTitle(input),
      });
      const key = sessionKey(session.ref);
      store.sessionState.transcriptCache.set(key, []);
      store.sessionState.loadedTranscriptKeys.add(key);
      store.sessionState.composerDraftsBySession.set(key, buildTaskExecutionBrief(snapshot, taskContext, executionModel));
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
            executionModel: toTaskSessionExecutionModelRecord(executionModel),
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
        const linkedSession = snapshot.taskSessionLinks.find((link) => link.taskId === input.taskId);
        snapshot = appendEvent(planningStore, snapshot, {
          type: "task.evidence-recorded",
          evidence: {
            taskId: input.taskId,
            taskPath: input.taskPath,
            text: evidence,
            ...(linkedSession
              ? {
                  sourceSessionId: linkedSession.sessionId,
                  sourceSessionTitle: linkedSession.title,
                }
              : {}),
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

function defaultWorkflowPreferences(): Omit<WorkflowPreferencesRecord, "capturedAt"> {
  return {
    commitPolicy: "per-task",
    branchModel: "single",
    uatDispatch: true,
    research: "skip",
    autonomousRun: defaultWorkflowAutonomousRunPolicy,
    workflowPrefsCaptured: true,
    models: {
      executorClass: "balanced",
      phaseOverrides: {},
    },
  };
}

const requirementClasses = new Set<RequirementRecord["class"]>([
  "functional",
  "quality",
  "constraint",
  "integration",
  "operational",
]);
const requirementStatuses = new Set<RequirementRecord["status"]>([
  "active",
  "validated",
  "deferred",
  "out-of-scope",
]);
const requirementSources = new Set<RequirementRecord["source"]>(["user", "inferred", "research", "execution"]);
const requirementValidationStatuses = new Set<RequirementRecord["validationStatus"]>([
  "unvalidated",
  "covered",
  "partial",
  "missing",
]);

function getPlanningRequirementRows(snapshot: PlanSnapshot): readonly RequirementRecord[] {
  return snapshot.requirements.length > 0 ? snapshot.requirements : buildRequirementDrafts(snapshot);
}

function normalizeRequirement(requirement: RequirementRecord): RequirementRecord {
  const id = requirement.id.trim() as RequirementRecord["id"];
  const title = requirement.title.trim();
  const description = requirement.description.trim();
  const why = requirement.why.trim();
  const owner = requirement.owner.trim();
  const notes = requirement.notes?.trim();
  if (!id.startsWith("R") || !title || !description || !why || !owner) {
    throw new Error("Requirements need an R-prefixed id, title, description, why, and owner");
  }
  if (
    !requirementClasses.has(requirement.class) ||
    !requirementStatuses.has(requirement.status) ||
    !requirementSources.has(requirement.source) ||
    !requirementValidationStatuses.has(requirement.validationStatus)
  ) {
    throw new Error("Requirement class, status, source, and validation status must be recognized values");
  }

  const normalized: RequirementRecord = {
    id,
    title,
    class: requirement.class,
    status: requirement.status,
    description,
    why,
    source: requirement.source,
    owner,
    validationStatus: requirement.validationStatus,
  };
  return notes ? { ...normalized, notes } : normalized;
}

function normalizeWorkflowPreferences(
  preferences: Omit<WorkflowPreferencesRecord, "capturedAt">,
): Omit<WorkflowPreferencesRecord, "capturedAt"> {
  return {
    commitPolicy: preferences.commitPolicy,
    branchModel: preferences.branchModel,
    uatDispatch: preferences.uatDispatch,
    research: preferences.research,
    autonomousRun: normalizeWorkflowAutonomousRunPolicy(preferences.autonomousRun),
    workflowPrefsCaptured: preferences.workflowPrefsCaptured,
    models: {
      executorClass: preferences.models.executorClass,
      phaseOverrides: normalizeWorkflowPhaseModelPreferences(preferences.models.phaseOverrides),
    },
  };
}

function getRequiredPlanSnapshot(planningStore: PlanningStore, planId: string): PlanSnapshot {
  const snapshot = planningStore.getPlanSnapshot(planId);
  if (!snapshot) {
    throw new Error(`Unknown plan: ${planId}`);
  }
  return snapshot;
}

function getLatestAcceptedPlanOutput(snapshot: PlanSnapshot) {
  return [...snapshot.generatedOutputs]
    .filter((output) => output.stage === "roadmap" && output.status === "accepted")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
}

function injectTaskIntoAcceptedPlan(
  proposal: PlanningPlanProposalDraft,
  targetMilestoneId: string,
  targetSliceId: string,
  task: PlanningTaskDraft,
): PlanningPlanProposalDraft {
  const existingTaskIds = new Set(
    proposal.milestones.flatMap((milestone) =>
      milestone.slices.flatMap((slice) => slice.tasks.map((existingTask) => existingTask.id)),
    ),
  );
  if (existingTaskIds.has(task.id)) {
    throw new Error(`Task id ${task.id} already exists in the accepted PLAN`);
  }

  let targetFound = false;
  const nextMilestones = proposal.milestones.map((milestone) => {
    if (milestone.id !== targetMilestoneId) {
      return milestone;
    }
    return {
      ...milestone,
      slices: milestone.slices.map((slice) => {
        if (slice.id !== targetSliceId) {
          return slice;
        }
        targetFound = true;
        return {
          ...slice,
          tasks: [...slice.tasks, task],
        };
      }),
    };
  });

  if (!targetFound) {
    throw new Error(`Target slice ${targetMilestoneId}/${targetSliceId} is not part of the accepted PLAN`);
  }

  return {
    ...proposal,
    milestones: nextMilestones,
  };
}

function hideTaskFromAcceptedPlan(
  proposal: PlanningPlanProposalDraft,
  taskPath: string,
): { readonly proposal: PlanningPlanProposalDraft; readonly task: PlanningTaskDraft } {
  const [targetMilestoneId, targetSliceId, targetTaskId] = taskPath.split("/");
  if (!targetMilestoneId || !targetSliceId || !targetTaskId) {
    throw new Error(`Invalid task path: ${taskPath}`);
  }

  let hiddenTask: PlanningTaskDraft | undefined;
  const nextMilestones = proposal.milestones.map((milestone) => {
    if (milestone.id !== targetMilestoneId) {
      return milestone;
    }
    return {
      ...milestone,
      slices: milestone.slices.map((slice) => {
        if (slice.id !== targetSliceId) {
          return slice;
        }
        hiddenTask = slice.tasks.find((task) => task.id === targetTaskId);
        if (!hiddenTask) {
          return slice;
        }
        if (slice.tasks.length === 1) {
          throw new Error(`Task removal blocked: ${taskPath} is the last task in ${targetMilestoneId}/${targetSliceId}`);
        }
        return {
          ...slice,
          tasks: slice.tasks.filter((task) => task.id !== targetTaskId),
        };
      }),
    };
  });

  if (!hiddenTask) {
    throw new Error(`Task ${taskPath} is not part of the accepted PLAN`);
  }

  return {
    proposal: {
      ...proposal,
      milestones: nextMilestones,
    },
    task: hiddenTask,
  };
}

function restoreTaskToAcceptedPlan(
  proposal: PlanningPlanProposalDraft,
  injection: ApprovedPlanInjectionRecord,
): PlanningPlanProposalDraft {
  let restored = false;
  const nextMilestones = proposal.milestones.map((milestone) => {
    if (milestone.id !== injection.targetMilestoneId) {
      return milestone;
    }
    return {
      ...milestone,
      slices: milestone.slices.map((slice) => {
        if (slice.id !== injection.targetSliceId) {
          return slice;
        }
        if (slice.tasks.some((task) => task.id === injection.taskId)) {
          throw new Error(`Task restore blocked: ${injection.taskPath} is already active`);
        }
        restored = true;
        return {
          ...slice,
          tasks: [
            ...slice.tasks,
            {
              id: injection.taskId,
              title: injection.title,
              acceptance: injection.acceptance,
              dependencies: injection.dependencies,
              requirementIds: [],
            },
          ],
        };
      }),
    };
  });

  if (!restored) {
    throw new Error(
      `Task restore blocked: ${injection.targetMilestoneId}/${injection.targetSliceId} is not part of the accepted PLAN`,
    );
  }

  return {
    ...proposal,
    milestones: nextMilestones,
  };
}

function modifyTaskInAcceptedPlan(
  proposal: PlanningPlanProposalDraft,
  taskPath: string,
  patch: Pick<PlanningTaskDraft, "title" | "acceptance" | "dependencies">,
): {
  readonly proposal: PlanningPlanProposalDraft;
  readonly previousTask: PlanningTaskDraft;
  readonly task: PlanningTaskDraft;
  readonly targetMilestoneId: string;
  readonly targetSliceId: string;
} {
  const [targetMilestoneId, targetSliceId, targetTaskId] = taskPath.split("/");
  if (!targetMilestoneId || !targetSliceId || !targetTaskId) {
    throw new Error(`Invalid task path: ${taskPath}`);
  }

  let previousTask: PlanningTaskDraft | undefined;
  let modifiedTask: PlanningTaskDraft | undefined;
  const nextMilestones = proposal.milestones.map((milestone) => {
    if (milestone.id !== targetMilestoneId) {
      return milestone;
    }
    return {
      ...milestone,
      slices: milestone.slices.map((slice) => {
        if (slice.id !== targetSliceId) {
          return slice;
        }
        return {
          ...slice,
          tasks: slice.tasks.map((task) => {
            if (task.id !== targetTaskId) {
              return task;
            }
            previousTask = task;
            modifiedTask = {
              ...task,
              title: patch.title,
              acceptance: patch.acceptance,
              dependencies: patch.dependencies,
            };
            return modifiedTask;
          }),
        };
      }),
    };
  });

  if (!previousTask || !modifiedTask) {
    throw new Error(`Task ${taskPath} is not part of the accepted PLAN`);
  }

  return {
    proposal: {
      ...proposal,
      milestones: nextMilestones,
    },
    previousTask,
    task: modifiedTask,
    targetMilestoneId,
    targetSliceId,
  };
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
  const acceptedPlan = getLatestAcceptedPlanOutput(snapshot);
  if (!acceptedPlan) {
    throw new Error("Accepted PLAN is required before EXECUTE can start");
  }
  const proposal = parsePlanProposal(acceptedPlan.content);
  const validationIssues = proposal ? validatePlanProposal(proposal, getPlanningRequirementRows(snapshot)) : [
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

interface AcceptedPlanTaskContext {
  readonly milestone: PlanningMilestoneDraft;
  readonly slice: PlanningSliceDraft;
  readonly task: PlanningTaskDraft;
  readonly taskPath: string;
}

function getAcceptedPlanTaskContext(
  snapshot: PlanSnapshot,
  taskId: string,
  taskPath: string,
): AcceptedPlanTaskContext {
  const acceptedPlan = getLatestAcceptedPlanOutput(snapshot);
  const proposal = acceptedPlan ? parsePlanProposal(acceptedPlan.content) : undefined;
  if (!proposal) {
    throw new Error("Accepted PLAN content is invalid");
  }

  for (const milestone of proposal.milestones) {
    for (const slice of milestone.slices) {
      for (const task of slice.tasks) {
        const currentTaskPath = `${milestone.id}/${slice.id}/${task.id}`;
        if (task.id === taskId && currentTaskPath === taskPath) {
          return { milestone, slice, task, taskPath };
        }
      }
    }
  }

  throw new Error(`Task ${taskId} is not part of the accepted PLAN`);
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
    const verification = [...snapshot.taskVerifications]
      .reverse()
      .find((entry) => entry.taskId === task.taskId && entry.acceptance === task.acceptance);
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
  const acceptedPlan = getLatestAcceptedPlanOutput(snapshot);
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

function createOptionsWithResolvedModel(
  createOptions: CreateSessionOptions,
  executionModel: ResolvedWorkflowPhaseModel,
): CreateSessionOptions {
  if (!executionModel.providerId || !executionModel.modelId) {
    return createOptions;
  }

  return {
    ...createOptions,
    initialModel: {
      provider: executionModel.providerId,
      modelId: executionModel.modelId,
    },
  };
}

function toTaskSessionExecutionModelRecord(
  executionModel: ResolvedWorkflowPhaseModel,
): TaskSessionLinkExecutionModelRecord {
  return {
    source: executionModel.source,
    ...(executionModel.providerId ? { providerId: executionModel.providerId } : {}),
    ...(executionModel.modelId ? { modelId: executionModel.modelId } : {}),
  };
}

function buildTaskExecutionBrief(
  snapshot: PlanSnapshot,
  context: AcceptedPlanTaskContext,
  executionModel: ResolvedWorkflowPhaseModel,
): string {
  const requirementsById = new Map<string, RequirementRecord>(
    getPlanningRequirementRows(snapshot).map((requirement) => [requirement.id, requirement]),
  );
  const acceptedResearch = snapshot.generatedOutputs.filter(
    (output) => output.stage === "research" && output.status === "accepted",
  );
  const linkedRequirements = context.task.requirementIds.flatMap((requirementId) => {
    const requirement = requirementsById.get(requirementId);
    return requirement ? [requirement] : [];
  });

  return [
    `# Execute ${context.taskPath}: ${context.task.title}`,
    "",
    "This is a generated execution brief from the accepted plan. Edit it if needed, then send it when ready.",
    "",
    "## Task",
    "",
    `- Milestone: ${context.milestone.id} - ${context.milestone.title}`,
    `- Slice: ${context.slice.id} - ${context.slice.title}`,
    `- Task: ${context.task.id} - ${context.task.title}`,
    `- Dependencies: ${formatExecutionBriefList(context.task.dependencies)}`,
    "",
    "## Execution Model",
    "",
    `- Source: ${workflowPhaseModelSourceLabel(executionModel.source)}`,
    `- Model: ${workflowPhaseModelValueLabel(executionModel)}`,
    "",
    "## Acceptance",
    "",
    context.task.acceptance,
    "",
    "## Linked Requirements",
    "",
    renderExecutionBriefRequirements(linkedRequirements, context.task.requirementIds),
    "",
    "## Accepted Research",
    "",
    acceptedResearch.length > 0
      ? acceptedResearch.map((output) => `- ${output.title}: ${firstLine(output.content)}`).join("\n")
      : "- None",
    "",
    "## Verification Expectations",
    "",
    "- Update this task in the Plan Builder queue with execution status, notes, blockers, and evidence.",
    `- Evidence should prove: ${context.task.acceptance}`,
  ].join("\n");
}

function renderExecutionBriefRequirements(
  requirements: readonly RequirementRecord[],
  requirementIds: readonly string[],
): string {
  if (requirementIds.length === 0) {
    return "- None";
  }
  const requirementLines = requirements.map((requirement) =>
    `- ${requirement.id} (${requirement.status}, ${requirement.class}): ${requirement.title} - ${requirement.description}`,
  );
  const knownRequirementIds = new Set<string>(requirements.map((requirement) => requirement.id));
  const missingRequirementLines = requirementIds
    .filter((requirementId) => !knownRequirementIds.has(requirementId))
    .map((requirementId) => `- ${requirementId}: Missing requirement record`);
  return [...requirementLines, ...missingRequirementLines].join("\n") || "- None";
}

function formatExecutionBriefList(values: readonly string[]): string {
  return values.length > 0 ? values.join(", ") : "None";
}

function firstLine(value: string): string {
  return value.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? value.trim();
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
  const projectionInput = buildPlanningProjectionInput(snapshot, generatedAt);
  const drift = await compareGeneratedProjections({
    workspaceRoot: workspacePath,
    projectionInput,
  });
  try {
    const result = await regenerateProjections({
      workspaceRoot: workspacePath,
      projectionInput,
      ...(allowLegacyOverwrite !== undefined ? { allowLegacyOverwrite } : {}),
    });

    return {
      generatedAt,
      written: result.written.length,
      skipped: result.skipped.length,
      missing: drift.missing.length,
      stale: drift.stale.length,
      current: drift.current.length,
      conflicts: allowLegacyOverwrite ? [] : result.conflicts.map((conflict) => conflict.path),
    };
  } catch (error) {
    if (error instanceof ProjectionWriteConflictError) {
      return {
        generatedAt,
        written: 0,
        skipped: 0,
        missing: drift.missing.length,
        stale: drift.stale.length,
        current: drift.current.length,
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
