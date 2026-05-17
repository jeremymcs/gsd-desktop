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

    const withProject = store.appendEvent({
      planId: created.id,
      expectedRevision: created.revision,
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

    const withKeptIdea = store.appendEvent({
      planId: created.id,
      expectedRevision: withParkedItem.revision,
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

    const withDismissedIdea = store.appendEvent({
      planId: created.id,
      expectedRevision: withChangeProposal.revision,
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

    assert.equal(withShipSummary.revision, 18);
    assert.equal(withShipSummary.activePhase, "ship");
    assert.equal(withShipSummary.activeStage, "task");
    assert.equal(withShipSummary.taskSessionLinks.length, 1);
    assert.equal(withShipSummary.taskSessionLinks[0]?.taskPath, "M1/S1/T1");
    assert.equal(withShipSummary.taskExecutions.length, 1);
    assert.equal(withShipSummary.taskExecutions[0]?.status, "done");
    assert.equal(withShipSummary.taskExecutions[0]?.blocker, "");
    assert.equal(withShipSummary.taskExecutions[0]?.evidence[0]?.text, "Linked execution session was created and reopened.");
    assert.equal(withShipSummary.taskVerifications.length, 1);
    assert.equal(withShipSummary.taskVerifications[0]?.status, "passed");
    assert.equal(withShipSummary.shipSummaries.length, 1);
    assert.equal(withShipSummary.shipSummaries[0]?.summary, "Ready to hand off verified planning persistence.");
    assert.equal(withShipSummary.parkedItems.length, 1);
    assert.equal(withShipSummary.parkedItems[0]?.text, "Add a future automation review lane.");
    assert.equal(withShipSummary.parkedItems[0]?.reviewStatus, "dismissed");
    assert.equal(withShipSummary.parkedItems[0]?.reviewNote, "Dismissed after review.");
    assert.equal(withShipSummary.changeProposals.length, 1);
    assert.equal(withShipSummary.changeProposals[0]?.title, "Automation review lane");
    assert.equal(withShipSummary.changeProposals[0]?.status, "draft");
    store.close();

    store = openPlanningStore({ workspaceRoot });
    const reopened = store.getPlanSnapshot(created.id);

    assert.ok(reopened);
    assert.equal(reopened.revision, 18);
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
    assert.equal(reopened.taskVerifications.length, 1);
    assert.equal(reopened.taskVerifications[0]?.acceptance, "Persist every answer");
    assert.equal(reopened.taskVerifications[0]?.note, "Acceptance matched the recorded evidence.");
    assert.equal(reopened.shipSummaries.length, 1);
    assert.equal(reopened.shipSummaries[0]?.summary, "Ready to hand off verified planning persistence.");
    assert.equal(reopened.parkedItems.length, 1);
    assert.equal(reopened.parkedItems[0]?.sourceAnswerId, "parked-answer-1");
    assert.equal(reopened.parkedItems[0]?.text, "Add a future automation review lane.");
    assert.equal(reopened.parkedItems[0]?.reviewStatus, "dismissed");
    assert.equal(reopened.parkedItems[0]?.reviewNote, "Dismissed after review.");
    assert.equal(reopened.changeProposals.length, 1);
    assert.equal(reopened.changeProposals[0]?.sourceParkedItemId, reopened.parkedItems[0]?.id);
    assert.equal(reopened.changeProposals[0]?.impactNotes, "Need to assess milestone, slice, and verification impact before approval.");
    assert.equal(reopened.events.length, 18);
    assert.equal(store.listPlans().length, 1);

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

async function makeWorkspace() {
  return await mkdtemp(join(tmpdir(), "pi-gsd-planning-"));
}
