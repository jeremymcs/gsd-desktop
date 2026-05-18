import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  openPlanningStore,
  planningDatabasePath,
  PlanningRevisionConflictError,
} from "../dist/index.js";

test("creates a repo-local planning database and replays event-backed plan state after reopen", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    let store = openPlanningStore({ workspaceRoot });
    const created = store.createPlan({ name: "Plan Builder" });

    assert.equal(created.readableId, "P001");
    assert.equal(created.name, "Plan Builder");
    assert.equal(created.revision, 0);
    assert.equal(created.activePhase, "discuss");
    assert.equal(created.activeStage, "project");
    assert.equal(existsSync(planningDatabasePath(workspaceRoot)), true);
    assert.match(await readFile(join(workspaceRoot, ".gitignore"), "utf8"), /^\.gsd\/gsd\.db$/m);

    const withWorkflowPreferences = store.appendEvent({
      planId: created.id,
      expectedRevision: created.revision,
      event: {
        type: "workflow.preferences-updated",
        preferences: {
          commitPolicy: "per-task",
          branchModel: "single",
          uatDispatch: true,
          research: "skip",
          workflowPrefsCaptured: true,
          models: {
            executorClass: "balanced",
            phaseOverrides: {
              plan: {
                providerId: "openai",
                modelId: "gpt-5",
              },
            },
          },
        },
      },
    });

    const withProject = store.appendEvent({
      planId: created.id,
      expectedRevision: withWorkflowPreferences.revision,
      event: {
        type: "project.updated",
        project: {
          title: "Database-backed Plan Builder",
          vision: "Guide users from discussion to generated plans.",
          antiGoals: ["Generic form wizard"],
          constraints: ["Database is canonical"],
          shape: {
            complexity: "complex",
            rationale: "Spans data, UI, and generated projections.",
          },
        },
      },
    });

    const withAnswer = store.appendEvent({
      planId: created.id,
      expectedRevision: withProject.revision,
      event: {
        type: "answer.recorded",
        answer: {
          stage: "project",
          questionId: "vision",
          prompt: "What do you want to build?",
          answer: "A guided planning workbench.",
          loadBearing: true,
        },
      },
    });

    const withParkedAnswer = store.appendEvent({
      planId: created.id,
      expectedRevision: withAnswer.revision,
      event: {
        type: "answer.recorded",
        answer: {
          id: "parked-answer-1",
          stage: "project",
          questionId: "vision",
          prompt: "What do you want to build?",
          answer: "Add a future automation review lane.",
          loadBearing: false,
          discretionRationale: "Parked for later review",
        },
      },
    });

    const withParkedItem = store.appendEvent({
      planId: created.id,
      expectedRevision: withParkedAnswer.revision,
      event: {
        type: "idea.parked",
        item: {
          sourceType: "answer",
          sourceAnswerId: "parked-answer-1",
          sourceStage: "project",
          sourceQuestionId: "vision",
          sourcePrompt: "What do you want to build?",
          text: "Add a future automation review lane.",
          rationale: "Parked for later review",
        },
      },
    });

    const withModificationParkedItem = store.appendEvent({
      planId: created.id,
      expectedRevision: withParkedItem.revision,
      event: {
        type: "idea.parked",
        item: {
          id: "parked-item-modification",
          sourceType: "answer",
          sourceAnswerId: "parked-answer-1",
          sourceStage: "project",
          sourceQuestionId: "vision",
          sourcePrompt: "What do you want to build?",
          text: "Tighten primary task acceptance.",
          rationale: "Parked for later task modification",
        },
      },
    });

    const withKeptIdea = store.appendEvent({
      planId: created.id,
      expectedRevision: withModificationParkedItem.revision,
      event: {
        type: "idea.reviewed",
        itemId: withParkedItem.parkedItems[0].id,
        status: "kept",
        note: "Keep this for a later review pass.",
      },
    });

    const withPromotionReadyIdea = store.appendEvent({
      planId: created.id,
      expectedRevision: withKeptIdea.revision,
      event: {
        type: "idea.reviewed",
        itemId: withParkedItem.parkedItems[0].id,
        status: "promotion-ready",
        note: "Prepare this for a later change proposal.",
      },
    });

    const modificationSourceId = "parked-item-modification";
    const withChangeProposal = store.appendEvent({
      planId: created.id,
      expectedRevision: withPromotionReadyIdea.revision,
      event: {
        type: "change.proposal-drafted",
        proposal: {
          sourceType: "parked-item",
          sourceParkedItemId: withParkedItem.parkedItems[0].id,
          title: "Automation review lane",
          summary: "Add a future automation review lane.",
          impactNotes: "Need to assess milestone, slice, and verification impact before approval.",
        },
      },
    });

    const withModificationChangeProposal = store.appendEvent({
      planId: created.id,
      expectedRevision: withChangeProposal.revision,
      event: {
        type: "change.proposal-drafted",
        proposal: {
          sourceType: "parked-item",
          sourceParkedItemId: modificationSourceId,
          title: "Primary task acceptance update",
          summary: "Tighten the primary task acceptance before execution.",
          impactNotes: "Need to re-check verification evidence after acceptance changes.",
        },
      },
    });
    const modificationProposal = withModificationChangeProposal.changeProposals.find(
      (proposal) => proposal.title === "Primary task acceptance update",
    );
    assert.ok(modificationProposal);

    const withApprovedProposal = store.appendEvent({
      planId: created.id,
      expectedRevision: withModificationChangeProposal.revision,
      event: {
        type: "change.proposal-approved",
        proposalId: withChangeProposal.changeProposals[0].id,
        injection: {
          changeProposalId: withChangeProposal.changeProposals[0].id,
          sourceParkedItemId: withParkedItem.parkedItems[0].id,
          acceptedOutputId: "roadmap-output-1",
          targetMilestoneId: "M1",
          targetSliceId: "S1",
          taskId: "T2",
          taskPath: "M1/S1/T2",
          title: "Add automation review task",
          acceptance: "Automation review lane is represented in PLAN.",
          dependencies: ["T1"],
        },
      },
    });

    const withApprovedModification = store.appendEvent({
      planId: created.id,
      expectedRevision: withApprovedProposal.revision,
      event: {
        type: "change.proposal-modification-approved",
        proposalId: modificationProposal.id,
        modification: {
          changeProposalId: modificationProposal.id,
          sourceParkedItemId: modificationSourceId,
          acceptedOutputId: "roadmap-output-2",
          targetMilestoneId: "M1",
          targetSliceId: "S1",
          taskId: "T1",
          taskPath: "M1/S1/T1",
          previousTitle: "Persist every answer",
          title: "Persist every planning answer",
          previousAcceptance: "Persist every answer",
          acceptance: "Persist every answer and projection state",
          previousDependencies: [],
          dependencies: [],
        },
      },
    });

    const withHiddenTask = store.appendEvent({
      planId: created.id,
      expectedRevision: withApprovedModification.revision,
      event: {
        type: "plan.item-hidden",
        item: {
          targetType: "task",
          targetId: "T2",
          targetPath: "M1/S1/T2",
          reason: "No longer needed in the active plan.",
          acceptedOutputId: "roadmap-output-3",
        },
      },
    });

    const withDismissedIdea = store.appendEvent({
      planId: created.id,
      expectedRevision: withHiddenTask.revision,
      event: {
        type: "idea.reviewed",
        itemId: withParkedItem.parkedItems[0].id,
        status: "dismissed",
        note: "Dismissed after review.",
      },
    });

    const withRequirement = store.appendEvent({
      planId: created.id,
      expectedRevision: withDismissedIdea.revision,
      event: {
        type: "requirement.upserted",
        requirement: {
          id: "R001",
          title: "Persist every answer",
          class: "operational",
          status: "active",
          description: "Every committed wizard answer is durable before generated processing starts.",
          why: "Users should not lose planning work on restart.",
          source: "user",
          owner: "M001/S01",
          validationStatus: "covered",
          notes: "S01 proves event-backed persistence.",
        },
      },
    });

    const withExecutePhase = store.appendEvent({
      planId: created.id,
      expectedRevision: withRequirement.revision,
      event: {
        type: "phase.updated",
        phase: "execute",
        stage: "task",
      },
    });

    const withTaskSession = store.appendEvent({
      planId: created.id,
      expectedRevision: withExecutePhase.revision,
      event: {
        type: "task.session-linked",
        link: {
          taskId: "T1",
          taskPath: "M1/S1/T1",
          workspaceId: "workspace-1",
          sessionId: "session-1",
          title: "Task T1 - Persist every answer",
        },
      },
    });

    const withTaskStatus = store.appendEvent({
      planId: created.id,
      expectedRevision: withTaskSession.revision,
      event: {
        type: "task.status-updated",
        task: {
          taskId: "T1",
          taskPath: "M1/S1/T1",
          status: "blocked",
          note: "Implementation started.",
          blocker: "Waiting on schema review.",
        },
      },
    });

    const withTaskDone = store.appendEvent({
      planId: created.id,
      expectedRevision: withTaskStatus.revision,
      event: {
        type: "task.status-updated",
        task: {
          taskId: "T1",
          taskPath: "M1/S1/T1",
          status: "done",
          note: "Implementation completed.",
          blocker: "",
        },
      },
    });

    const withTaskEvidence = store.appendEvent({
      planId: created.id,
      expectedRevision: withTaskDone.revision,
      event: {
        type: "task.evidence-recorded",
        evidence: {
          taskId: "T1",
          taskPath: "M1/S1/T1",
          text: "Linked execution session was created and reopened.",
          sourceSessionId: "session-1",
          sourceSessionTitle: "Task T1 - Persist every answer",
        },
      },
    });

    const withVerifyPhase = store.appendEvent({
      planId: created.id,
      expectedRevision: withTaskEvidence.revision,
      event: {
        type: "phase.updated",
        phase: "verify",
        stage: "task",
      },
    });

    const withVerification = store.appendEvent({
      planId: created.id,
      expectedRevision: withVerifyPhase.revision,
      event: {
        type: "task.verification-recorded",
        verification: {
          taskId: "T1",
          taskPath: "M1/S1/T1",
          acceptance: "Persist every answer",
          status: "passed",
          note: "Acceptance matched the recorded evidence.",
        },
      },
    });

    const withShipPhase = store.appendEvent({
      planId: created.id,
      expectedRevision: withVerification.revision,
      event: {
        type: "phase.updated",
        phase: "ship",
        stage: "task",
      },
    });

    const withShipSummary = store.appendEvent({
      planId: created.id,
      expectedRevision: withShipPhase.revision,
      event: {
        type: "ship.summary-recorded",
        summary: {
          summary: "Ready to hand off verified planning persistence.",
        },
      },
    });

    assert.equal(withShipSummary.revision, 24);
    assert.equal(withShipSummary.activePhase, "ship");
    assert.equal(withShipSummary.activeStage, "task");
    assert.equal(withShipSummary.taskSessionLinks.length, 1);
    assert.equal(withShipSummary.taskSessionLinks[0]?.taskPath, "M1/S1/T1");
    assert.equal(withShipSummary.taskExecutions.length, 1);
    assert.equal(withShipSummary.taskExecutions[0]?.status, "done");
    assert.equal(withShipSummary.taskExecutions[0]?.blocker, "");
    assert.equal(withShipSummary.taskExecutions[0]?.evidence[0]?.text, "Linked execution session was created and reopened.");
    assert.equal(withShipSummary.taskExecutions[0]?.evidence[0]?.sourceSessionTitle, "Task T1 - Persist every answer");
    assert.equal(withShipSummary.taskVerifications.length, 1);
    assert.equal(withShipSummary.taskVerifications[0]?.status, "passed");
    assert.equal(withShipSummary.shipSummaries.length, 1);
    assert.equal(withShipSummary.shipSummaries[0]?.summary, "Ready to hand off verified planning persistence.");
    assert.equal(withShipSummary.workflowPreferences?.commitPolicy, "per-task");
    assert.equal(withShipSummary.workflowPreferences?.autonomousRun.mode, "supervised");
    assert.equal(withShipSummary.workflowPreferences?.autonomousRun.commitCadence, "per-task");
    assert.equal(withShipSummary.workflowPreferences?.autonomousRun.verificationRequired, true);
    assert.deepEqual(withShipSummary.workflowPreferences?.autonomousRun.stopConditions, [
      "tests-fail",
      "scope-ambiguous",
      "destructive-action",
      "dirty-conflict",
      "milestone-complete",
    ]);
    assert.equal(withShipSummary.workflowPreferences?.autonomousRun.guardrails.length, 5);
    assert.equal(withShipSummary.workflowPreferences?.autonomousRun.guardrails[0]?.action, "stop-and-report");
    assert.match(withShipSummary.workflowPreferences?.autonomousRun.guardrails[0]?.description ?? "", /typecheck/);
    assert.equal(withShipSummary.workflowPreferences?.models.executorClass, "balanced");
    assert.equal(withShipSummary.workflowPreferences?.models.phaseOverrides?.plan?.modelId, "gpt-5");
    assert.equal(withShipSummary.parkedItems.length, 2);
    assert.equal(withShipSummary.parkedItems[0]?.text, "Add a future automation review lane.");
    assert.equal(withShipSummary.parkedItems[0]?.reviewStatus, "dismissed");
    assert.equal(withShipSummary.parkedItems[0]?.reviewNote, "Dismissed after review.");
    assert.equal(withShipSummary.changeProposals.length, 2);
    assert.equal(withShipSummary.changeProposals[0]?.title, "Automation review lane");
    assert.equal(withShipSummary.changeProposals[0]?.status, "approved");
    assert.equal(withShipSummary.changeProposals[0]?.injectedTaskPath, "M1/S1/T2");
    assert.equal(withShipSummary.approvedInjections.length, 1);
    assert.equal(withShipSummary.approvedInjections[0]?.taskPath, "M1/S1/T2");
    assert.equal(withShipSummary.approvedModifications.length, 1);
    assert.equal(withShipSummary.approvedModifications[0]?.taskPath, "M1/S1/T1");
    assert.equal(withShipSummary.approvedModifications[0]?.acceptance, "Persist every answer and projection state");
    assert.equal(withShipSummary.hiddenPlanItems.length, 1);
    assert.equal(withShipSummary.hiddenPlanItems[0]?.targetPath, "M1/S1/T2");
    store.close();

    store = openPlanningStore({ workspaceRoot });
    const reopened = store.getPlanSnapshot(created.id);

    assert.ok(reopened);
    assert.equal(reopened.revision, 24);
    assert.equal(reopened.activePhase, "ship");
    assert.equal(reopened.activeStage, "task");
    assert.equal(reopened.project.title, "Database-backed Plan Builder");
    assert.deepEqual(reopened.project.antiGoals, ["Generic form wizard"]);
    assert.equal(reopened.answers.length, 2);
    assert.equal(reopened.answers[0]?.answer, "A guided planning workbench.");
    assert.equal(reopened.answers[1]?.loadBearing, false);
    assert.equal(reopened.requirements.length, 1);
    assert.equal(reopened.requirements[0]?.id, "R001");
    assert.equal(reopened.requirements[0]?.validationStatus, "covered");
    assert.equal(reopened.taskSessionLinks.length, 1);
    assert.equal(reopened.taskSessionLinks[0]?.taskId, "T1");
    assert.equal(reopened.taskSessionLinks[0]?.sessionId, "session-1");
    assert.equal(reopened.taskExecutions.length, 1);
    assert.equal(reopened.taskExecutions[0]?.taskPath, "M1/S1/T1");
    assert.equal(reopened.taskExecutions[0]?.status, "done");
    assert.equal(reopened.taskExecutions[0]?.note, "Implementation completed.");
    assert.equal(reopened.taskExecutions[0]?.evidence.length, 1);
    assert.equal(reopened.taskExecutions[0]?.evidence[0]?.sourceSessionId, "session-1");
    assert.equal(reopened.taskExecutions[0]?.evidence[0]?.sourceSessionTitle, "Task T1 - Persist every answer");
    assert.equal(reopened.taskVerifications.length, 1);
    assert.equal(reopened.taskVerifications[0]?.acceptance, "Persist every answer");
    assert.equal(reopened.taskVerifications[0]?.note, "Acceptance matched the recorded evidence.");
    assert.equal(reopened.shipSummaries.length, 1);
    assert.equal(reopened.shipSummaries[0]?.summary, "Ready to hand off verified planning persistence.");
    assert.equal(reopened.workflowPreferences?.branchModel, "single");
    assert.equal(reopened.workflowPreferences?.research, "skip");
    assert.equal(reopened.workflowPreferences?.autonomousRun.mode, "supervised");
    assert.equal(reopened.workflowPreferences?.autonomousRun.stopConditions.includes("milestone-complete"), true);
    assert.equal(
      reopened.workflowPreferences?.autonomousRun.guardrails.some(
        (guardrail) => guardrail.condition === "dirty-conflict" && guardrail.label === "Dirty worktree conflict",
      ),
      true,
    );
    assert.equal(reopened.workflowPreferences?.workflowPrefsCaptured, true);
    assert.equal(reopened.workflowPreferences?.models.phaseOverrides?.plan?.providerId, "openai");
    assert.equal(reopened.parkedItems.length, 2);
    assert.equal(reopened.parkedItems[0]?.sourceAnswerId, "parked-answer-1");
    assert.equal(reopened.parkedItems[0]?.text, "Add a future automation review lane.");
    assert.equal(reopened.parkedItems[0]?.reviewStatus, "dismissed");
    assert.equal(reopened.parkedItems[0]?.reviewNote, "Dismissed after review.");
    assert.equal(reopened.changeProposals.length, 2);
    assert.equal(reopened.changeProposals[0]?.sourceParkedItemId, reopened.parkedItems[0]?.id);
    assert.equal(reopened.changeProposals[0]?.impactNotes, "Need to assess milestone, slice, and verification impact before approval.");
    assert.equal(reopened.changeProposals[0]?.status, "approved");
    assert.equal(reopened.changeProposals[0]?.acceptedOutputId, "roadmap-output-1");
    assert.equal(reopened.approvedInjections.length, 1);
    assert.equal(reopened.approvedInjections[0]?.changeProposalId, reopened.changeProposals[0]?.id);
    assert.deepEqual(reopened.approvedInjections[0]?.dependencies, ["T1"]);
    assert.equal(reopened.approvedModifications.length, 1);
    assert.equal(reopened.approvedModifications[0]?.changeProposalId, modificationProposal.id);
    assert.equal(reopened.approvedModifications[0]?.previousTitle, "Persist every answer");
    assert.equal(reopened.approvedModifications[0]?.title, "Persist every planning answer");
    assert.equal(reopened.approvedModifications[0]?.previousAcceptance, "Persist every answer");
    assert.equal(reopened.approvedModifications[0]?.acceptance, "Persist every answer and projection state");
    assert.equal(reopened.changeProposals[1]?.modifiedTaskPath, "M1/S1/T1");
    assert.equal(reopened.hiddenPlanItems.length, 1);
    assert.equal(reopened.hiddenPlanItems[0]?.targetId, "T2");
    assert.equal(reopened.hiddenPlanItems[0]?.reason, "No longer needed in the active plan.");
    assert.equal(reopened.hiddenPlanItems[0]?.acceptedOutputId, "roadmap-output-3");
    assert.equal(reopened.events.length, 24);
    assert.equal(store.listPlans().length, 1);

    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("replays hidden plan item restoration", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    let store = openPlanningStore({ workspaceRoot });
    const created = store.createPlan({ name: "Restore Hidden Task" });
    const hidden = store.appendEvent({
      planId: created.id,
      expectedRevision: created.revision,
      event: {
        type: "plan.item-hidden",
        item: {
          id: "hidden-task-1",
          targetType: "task",
          targetId: "T2",
          targetPath: "M1/S1/T2",
          reason: "No longer needed in the active plan.",
          acceptedOutputId: "roadmap-output-1",
        },
      },
    });

    assert.equal(hidden.hiddenPlanItems.length, 1);
    assert.equal(hidden.hiddenPlanItems[0]?.targetPath, "M1/S1/T2");

    const restored = store.appendEvent({
      planId: created.id,
      expectedRevision: hidden.revision,
      event: {
        type: "plan.item-restored",
        itemId: "hidden-task-1",
        targetPath: "M1/S1/T2",
        acceptedOutputId: "roadmap-output-2",
      },
    });

    assert.equal(restored.hiddenPlanItems.length, 0);
    store.close();

    store = openPlanningStore({ workspaceRoot });
    const reopened = store.getPlanSnapshot(created.id);

    assert.ok(reopened);
    assert.equal(reopened.hiddenPlanItems.length, 0);
    assert.equal(reopened.events.length, 2);
    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("replays withdrawn change proposals", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    let store = openPlanningStore({ workspaceRoot });
    const created = store.createPlan({ name: "Withdraw Draft Proposal" });
    const drafted = store.appendEvent({
      planId: created.id,
      expectedRevision: created.revision,
      event: {
        type: "change.proposal-drafted",
        proposal: {
          sourceType: "parked-item",
          sourceParkedItemId: "idea-1",
          title: "Draft cleanup",
          summary: "Remove a draft before approval.",
          impactNotes: "No active plan impact.",
        },
      },
    });
    const proposalId = drafted.changeProposals[0]?.id;

    assert.ok(proposalId);
    assert.equal(drafted.changeProposals[0]?.status, "draft");

    const withdrawn = store.appendEvent({
      planId: created.id,
      expectedRevision: drafted.revision,
      event: {
        type: "change.proposal-withdrawn",
        proposalId,
      },
    });

    assert.equal(withdrawn.changeProposals[0]?.status, "withdrawn");
    assert.equal(Boolean(withdrawn.changeProposals[0]?.withdrawnAt), true);
    store.close();

    store = openPlanningStore({ workspaceRoot });
    const reopened = store.getPlanSnapshot(created.id);

    assert.ok(reopened);
    assert.equal(reopened.changeProposals[0]?.status, "withdrawn");
    assert.equal(Boolean(reopened.changeProposals[0]?.withdrawnAt), true);
    assert.equal(reopened.events.length, 2);
    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("replays draft change proposal updates", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    let store = openPlanningStore({ workspaceRoot });
    const created = store.createPlan({ name: "Update Draft Proposal" });
    const drafted = store.appendEvent({
      planId: created.id,
      expectedRevision: created.revision,
      event: {
        type: "change.proposal-drafted",
        proposal: {
          sourceType: "parked-item",
          sourceParkedItemId: "idea-1",
          title: "Original draft",
          summary: "Draft summary before revision.",
          impactNotes: "Initial impact notes.",
        },
      },
    });
    const proposalId = drafted.changeProposals[0]?.id;
    assert.ok(proposalId);

    const updated = store.appendEvent({
      planId: created.id,
      expectedRevision: drafted.revision,
      event: {
        type: "change.proposal-updated",
        proposalId,
        title: "Updated draft",
        summary: "Draft summary after revision.",
        impactNotes: "Updated impact notes.",
      },
    });

    assert.equal(updated.changeProposals[0]?.title, "Updated draft");
    assert.equal(updated.changeProposals[0]?.summary, "Draft summary after revision.");
    assert.equal(updated.changeProposals[0]?.impactNotes, "Updated impact notes.");
    store.close();

    store = openPlanningStore({ workspaceRoot });
    const reopened = store.getPlanSnapshot(created.id);

    assert.ok(reopened);
    assert.equal(reopened.changeProposals[0]?.title, "Updated draft");
    assert.equal(reopened.changeProposals[0]?.summary, "Draft summary after revision.");
    assert.equal(reopened.changeProposals[0]?.impactNotes, "Updated impact notes.");
    assert.equal(reopened.events.length, 2);
    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("derives change proposal activity from lifecycle events", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    let store = openPlanningStore({ workspaceRoot });
    const created = store.createPlan({ name: "Proposal Activity" });
    let snapshot = store.appendEvent({
      planId: created.id,
      expectedRevision: created.revision,
      event: {
        type: "change.proposal-drafted",
        proposal: {
          id: "proposal-add-task",
          sourceType: "parked-item",
          sourceParkedItemId: "idea-1",
          title: "Add audit task",
          summary: "Add an audit task after verification.",
          impactNotes: "Execution needs a new task.",
        },
      },
    });
    snapshot = store.appendEvent({
      planId: created.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "change.proposal-updated",
        proposalId: "proposal-add-task",
        title: "Add post-ship audit task",
        summary: "Add a post-ship audit task after verification.",
        impactNotes: "Execution needs one extra task.",
      },
    });
    snapshot = store.appendEvent({
      planId: created.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "change.proposal-approved",
        proposalId: "proposal-add-task",
        injection: {
          changeProposalId: "proposal-add-task",
          sourceParkedItemId: "idea-1",
          acceptedOutputId: "roadmap-output-1",
          targetMilestoneId: "M1",
          targetSliceId: "S1",
          taskId: "T2",
          taskPath: "M1/S1/T2",
          title: "Run post-ship audit",
          acceptance: "Audit task is represented in PLAN.",
          dependencies: ["T1"],
        },
      },
    });
    snapshot = store.appendEvent({
      planId: created.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "plan.item-hidden",
        item: {
          id: "hidden-task-1",
          targetType: "task",
          targetId: "T2",
          targetPath: "M1/S1/T2",
          reason: "No longer needed in the active plan.",
          acceptedOutputId: "roadmap-output-2",
        },
      },
    });
    snapshot = store.appendEvent({
      planId: created.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "plan.item-restored",
        itemId: "hidden-task-1",
        targetPath: "M1/S1/T2",
        acceptedOutputId: "roadmap-output-3",
      },
    });
    snapshot = store.appendEvent({
      planId: created.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "change.proposal-drafted",
        proposal: {
          id: "proposal-withdrawn",
          sourceType: "parked-item",
          sourceParkedItemId: "idea-2",
          title: "Drop audit banner",
          summary: "Drop a banner before approval.",
          impactNotes: "No active plan impact.",
        },
      },
    });
    snapshot = store.appendEvent({
      planId: created.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "change.proposal-withdrawn",
        proposalId: "proposal-withdrawn",
      },
    });
    snapshot = store.appendEvent({
      planId: created.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "change.proposal-drafted",
        proposal: {
          id: "proposal-modify-task",
          sourceType: "parked-item",
          sourceParkedItemId: "idea-3",
          title: "Tighten task acceptance",
          summary: "Tighten acceptance before execution.",
          impactNotes: "Verification should use stricter evidence.",
        },
      },
    });
    snapshot = store.appendEvent({
      planId: created.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "change.proposal-modification-approved",
        proposalId: "proposal-modify-task",
        modification: {
          changeProposalId: "proposal-modify-task",
          sourceParkedItemId: "idea-3",
          acceptedOutputId: "roadmap-output-4",
          targetMilestoneId: "M1",
          targetSliceId: "S1",
          taskId: "T1",
          taskPath: "M1/S1/T1",
          previousTitle: "Build the thing",
          title: "Build the thing with evidence",
          previousAcceptance: "Thing exists.",
          acceptance: "Thing exists with verification evidence.",
          previousDependencies: [],
          dependencies: [],
        },
      },
    });

    assertProposalActivity(snapshot);
    store.close();

    store = openPlanningStore({ workspaceRoot });
    const reopened = store.getPlanSnapshot(created.id);
    assert.ok(reopened);
    assertProposalActivity(reopened);
    assert.equal(reopened.events.length, 9);
    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("rejects stale writes with a revision conflict", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    const store = openPlanningStore({ workspaceRoot });
    const created = store.createPlan({ name: "Revision Guard" });

    store.appendEvent({
      planId: created.id,
      expectedRevision: 0,
      event: {
        type: "stage.updated",
        stage: "project",
        status: "active",
        activeQuestionId: "vision",
      },
    });

    assert.throws(
      () => store.appendEvent({
        planId: created.id,
        expectedRevision: 0,
        event: {
          type: "stage.updated",
          stage: "requirements",
          status: "active",
          activeQuestionId: "capability_contract",
        },
      }),
      (error) => error instanceof PlanningRevisionConflictError
        && error.code === "PLANNING_REVISION_CONFLICT"
        && error.expectedRevision === 0
        && error.actualRevision === 1,
    );

    assert.equal(store.getPlanSnapshot(created.id)?.revision, 1);
    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("parks composer-origin ideas without synthetic answers or phase changes", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    const store = openPlanningStore({ workspaceRoot });
    const created = store.createPlan({ name: "Composer Parking" });
    const executing = store.appendEvent({
      planId: created.id,
      expectedRevision: created.revision,
      event: {
        type: "phase.updated",
        phase: "execute",
        stage: "task",
      },
    });

    const withParkedIdea = store.appendEvent({
      planId: created.id,
      expectedRevision: executing.revision,
      event: {
        type: "idea.parked",
        item: {
          sourceType: "composer",
          sourceStage: "task",
          sourceQuestionId: "composer_execute",
          sourcePrompt: "Composer note captured during EXECUTE",
          text: "Review a late integration concern.",
          rationale: "Parked from the Plan Builder composer",
        },
      },
    });

    assert.equal(withParkedIdea.activePhase, "execute");
    assert.equal(withParkedIdea.activeStage, "task");
    assert.equal(withParkedIdea.answers.length, 0);
    assert.equal(withParkedIdea.parkedItems.length, 1);
    assert.equal(withParkedIdea.parkedItems[0]?.sourceType, "composer");
    assert.equal(withParkedIdea.parkedItems[0]?.sourceAnswerId, undefined);
    assert.equal(withParkedIdea.parkedItems[0]?.sourceStage, "task");
    assert.equal(withParkedIdea.parkedItems[0]?.text, "Review a late integration concern.");

    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("replays parked idea updates without changing source metadata or review status", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    let store = openPlanningStore({ workspaceRoot });
    const created = store.createPlan({ name: "Edit Parked Idea" });
    const parked = store.appendEvent({
      planId: created.id,
      expectedRevision: created.revision,
      event: {
        type: "idea.parked",
        item: {
          id: "parked-idea-1",
          sourceType: "composer",
          sourceStage: "task",
          sourceQuestionId: "composer_execute",
          sourcePrompt: "Composer note captured during EXECUTE",
          text: "Review a late integration concern.",
          rationale: "Parked from the Plan Builder composer",
        },
      },
    });
    const reviewed = store.appendEvent({
      planId: created.id,
      expectedRevision: parked.revision,
      event: {
        type: "idea.reviewed",
        itemId: "parked-idea-1",
        status: "promotion-ready",
        note: "Prepare this for a later change proposal.",
      },
    });
    const updated = store.appendEvent({
      planId: created.id,
      expectedRevision: reviewed.revision,
      event: {
        type: "idea.updated",
        itemId: "parked-idea-1",
        text: "Review the late integration concern with retry boundaries.",
      },
    });

    assert.equal(updated.parkedItems[0]?.text, "Review the late integration concern with retry boundaries.");
    assert.equal(updated.parkedItems[0]?.sourcePrompt, "Composer note captured during EXECUTE");
    assert.equal(updated.parkedItems[0]?.reviewStatus, "promotion-ready");
    store.close();

    store = openPlanningStore({ workspaceRoot });
    const reopened = store.getPlanSnapshot(created.id);
    assert.ok(reopened);
    assert.equal(reopened.parkedItems[0]?.text, "Review the late integration concern with retry boundaries.");
    assert.equal(reopened.parkedItems[0]?.sourcePrompt, "Composer note captured during EXECUTE");
    assert.equal(reopened.parkedItems[0]?.reviewStatus, "promotion-ready");
    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("replays dismissed parked idea restoration", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    let store = openPlanningStore({ workspaceRoot });
    const created = store.createPlan({ name: "Restore Parked Idea" });
    const parked = store.appendEvent({
      planId: created.id,
      expectedRevision: created.revision,
      event: {
        type: "idea.parked",
        item: {
          id: "parked-idea-1",
          sourceType: "composer",
          sourceStage: "task",
          sourceQuestionId: "composer_execute",
          sourcePrompt: "Composer note captured during EXECUTE",
          text: "Review a late integration concern.",
          rationale: "Parked from the Plan Builder composer",
        },
      },
    });
    const dismissed = store.appendEvent({
      planId: created.id,
      expectedRevision: parked.revision,
      event: {
        type: "idea.reviewed",
        itemId: "parked-idea-1",
        status: "dismissed",
        note: "Dismissed after review.",
      },
    });
    const restored = store.appendEvent({
      planId: created.id,
      expectedRevision: dismissed.revision,
      event: {
        type: "idea.reviewed",
        itemId: "parked-idea-1",
        status: "parked",
        note: "Parked for later review",
      },
    });

    assert.equal(restored.parkedItems[0]?.reviewStatus, "parked");
    assert.equal(restored.parkedItems[0]?.reviewNote, "Parked for later review");
    store.close();

    store = openPlanningStore({ workspaceRoot });
    const reopened = store.getPlanSnapshot(created.id);
    assert.ok(reopened);
    assert.equal(reopened.parkedItems[0]?.reviewStatus, "parked");
    assert.equal(reopened.parkedItems[0]?.reviewNote, "Parked for later review");
    assert.equal(reopened.events.length, 3);
    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

async function makeWorkspace() {
  return await mkdtemp(join(tmpdir(), "pi-gsd-planning-"));
}

function assertProposalActivity(snapshot) {
  const added = snapshot.changeProposals.find((proposal) => proposal.id === "proposal-add-task");
  assert.ok(added);
  assert.equal(added.status, "approved");
  assert.equal(added.injectedTaskPath, "M1/S1/T2");
  assert.deepEqual(added.activity.map((activity) => activity.type), [
    "drafted",
    "updated",
    "approved",
    "task-hidden",
    "task-restored",
  ]);
  assert.deepEqual(added.activity.map((activity) => activity.revision), [1, 2, 3, 4, 5]);
  assert.equal(added.activity[2]?.targetPath, "M1/S1/T2");
  assert.equal(added.activity[3]?.acceptedOutputId, "roadmap-output-2");
  assert.equal(added.activity[4]?.summary, "Restored injected task M1/S1/T2");

  const withdrawn = snapshot.changeProposals.find((proposal) => proposal.id === "proposal-withdrawn");
  assert.ok(withdrawn);
  assert.equal(withdrawn.status, "withdrawn");
  assert.deepEqual(withdrawn.activity.map((activity) => activity.type), ["drafted", "withdrawn"]);

  const modified = snapshot.changeProposals.find((proposal) => proposal.id === "proposal-modify-task");
  assert.ok(modified);
  assert.equal(modified.status, "approved");
  assert.equal(modified.modifiedTaskPath, "M1/S1/T1");
  assert.deepEqual(modified.activity.map((activity) => activity.type), ["drafted", "task-modified"]);
  assert.equal(modified.activity[1]?.acceptedOutputId, "roadmap-output-4");
}
