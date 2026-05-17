import { access, readFile } from "node:fs/promises";
import { basename } from "node:path";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import {
  getDesktopState,
  launchDesktop,
  makeUserDataDir,
  makeWorkspace,
  waitForWorkspaceByPath,
} from "../helpers/electron-app";

const discussAnswers = [
  ["What should we call this project?", "Launch Control"],
  ["What are we building, and what outcome should it create?", "A UI-driven project planner that turns discussion into execution-ready work."],
  ["Who is it for, and what pain are they bringing?", "Builders who need the workflow remembered across every planning turn."],
  ["What must feel clearly better when this ships?", "Starting a project feels guided, durable, and ready for clean execution."],
  ["What should this not become?", "A static markdown questionnaire\nA brittle one-shot prompt"],
  ["What constraints should shape every decision?", "Database is canonical\nMarkdown is projection\nUsers can revise prior answers"],
  ["What must the first useful version be able to do?", "Create a plan, ask focused questions, save answers, and resume after restart."],
  ["What quality bar makes this acceptable?", "No lost answers, clear stage state, and revision-safe writes."],
  ["What systems, files, data, or people does this need to interact with?", ".gsd/gsd.db, generated GSD files, and the desktop workspace shell."],
  ["How should we know the requirements are complete enough to plan?", "All load-bearing answers are captured and the user confirms the depth gate."],
  ["What should the first milestone prove end to end?", "A persisted DISCUSS flow from plan creation through confirmed milestone context."],
  ["What major phases or slices do you expect?", "DISCUSS, RESEARCH, PLAN, EXECUTE, VERIFY, SHIP."],
  ["What could block execution or force the plan to change?", "Schema gaps, unclear dependencies, or UI changes that do not persist."],
  ["What would make you comfortable shipping this project?", "Restart persistence passes and the outline matches the saved discussion."],
] as const;

test("opens the workspace-aware Plan Builder from sidebar and New Thread", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-workspace");
  const workspaceName = basename(workspacePath);

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(window.getByTestId("plan-builder-view")).toBeVisible();
    await expect(window.getByTestId("plan-builder-title")).toHaveText(`Build a plan for ${workspaceName}`);
    await expect(window.locator(".topbar__session")).toHaveText("Plans");
    await expect(window.getByRole("button", { name: "Plans", exact: true })).toHaveClass(/sidebar__nav-item--active/);
    await expect.poll(async () => (await getDesktopState(window)).activeView).toBe("plans");

    await window.getByRole("button", { name: "New thread", exact: true }).click();
    await expect(window.getByTestId("new-thread-composer")).toBeVisible();
    await window.getByRole("button", { name: "Plan a new project", exact: true }).click();
    await expect(window.getByTestId("plan-builder-view")).toBeVisible();
    await expect(window.getByTestId("plan-builder-title")).toHaveText(`Build a plan for ${workspaceName}`);
    await expect.poll(async () => (await getDesktopState(window)).activeView).toBe("plans");
  } finally {
    await harness.close();
  }
});

test("persists DISCUSS memory plus accepted RESEARCH and PLAN output across restart", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-discuss");
  const workspaceName = basename(workspacePath);

  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(window.getByTestId("plan-builder-title")).toHaveText(`Build a plan for ${workspaceName}`);
    await window.getByTestId("plan-name-input").fill("Launch plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Launch plan");
    await expect(window.getByTestId("workflow-preferences-card")).toContainText("Workflow preferences");
    await window.getByTestId("apply-workflow-preferences-button").click();
    await expect(window.getByTestId("workflow-preferences-card")).toContainText("Workflow preferences saved");
    const preferencesProjection = await readFile(join(workspacePath, ".gsd", "PREFERENCES.md"), "utf8");
    expect(preferencesProjection).toContain("commit_policy: per-task");
    expect(preferencesProjection).toContain("branch_model: single");
    expect(preferencesProjection).toContain("workflow_prefs_captured: true");
    const researchDecision = JSON.parse(
      await readFile(join(workspacePath, ".gsd", "runtime", "research-decision.json"), "utf8"),
    ) as { decision: string; source: string };
    expect(researchDecision.decision).toBe("skip");
    expect(researchDecision.source).toBe("workflow-preferences");
    await expect(window.getByTestId("plan-question-prompt")).toHaveText("What should we call this project?");
    for (const idea of [
      "Later automation follow-up",
      "Prepare integration change",
      "Tighten primary task acceptance",
      "Drop onboarding banner",
    ]) {
      await window.getByTestId("plan-answer-textarea").fill(idea);
      await window.getByRole("button", { name: "Park" }).click();
      await expect(window.getByTestId("plan-idea-pool")).toContainText(idea);
    }
    await expect(window.getByTestId("plan-question-prompt")).toHaveText("What should we call this project?");
    await expect(window.getByTestId("plan-answer-textarea")).toHaveValue("");
    const keptIdea = window.getByTestId("plan-idea-item").filter({ hasText: "Later automation follow-up" });
    await keptIdea.getByRole("button", { name: "Keep" }).click();
    await expect(keptIdea.getByTestId("plan-idea-status")).toHaveText("Kept");
    const promotionIdea = window.getByTestId("plan-idea-item").filter({ hasText: "Prepare integration change" });
    await promotionIdea.getByRole("button", { name: "Prepare" }).click();
    await expect(promotionIdea.getByTestId("plan-idea-status")).toHaveText("Ready to promote");
    await promotionIdea.getByRole("button", { name: "Draft change" }).click();
    await expect(promotionIdea.getByTestId("plan-change-draft-form")).toBeVisible();
    await promotionIdea.getByTestId("plan-change-title-input").fill("Integration change draft");
    await promotionIdea
      .getByTestId("plan-change-summary-textarea")
      .fill("Prepare the integration change before it enters the active plan.");
    await promotionIdea
      .getByTestId("plan-change-impact-textarea")
      .fill("Impact: review roadmap boundaries, task dependencies, and verification evidence before approval.");
    await promotionIdea.getByRole("button", { name: "Save draft" }).click();
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Integration change draft");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Impact: review roadmap boundaries");
    const modificationIdea = window.getByTestId("plan-idea-item").filter({ hasText: "Tighten primary task acceptance" });
    await modificationIdea.getByRole("button", { name: "Prepare" }).click();
    await expect(modificationIdea.getByTestId("plan-idea-status")).toHaveText("Ready to promote");
    await modificationIdea.getByRole("button", { name: "Draft change" }).click();
    await expect(modificationIdea.getByTestId("plan-change-draft-form")).toBeVisible();
    await modificationIdea.getByTestId("plan-change-title-input").fill("Primary task acceptance update");
    await modificationIdea
      .getByTestId("plan-change-summary-textarea")
      .fill("Tighten the primary task acceptance before execution starts.");
    await modificationIdea
      .getByTestId("plan-change-impact-textarea")
      .fill("Impact: acceptance must include generated projections and change-control persistence.");
    await modificationIdea.getByRole("button", { name: "Save draft" }).click();
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Primary task acceptance update");
    const dismissedIdea = window.getByTestId("plan-idea-item").filter({ hasText: "Drop onboarding banner" });
    await dismissedIdea.getByRole("button", { name: "Dismiss" }).click();
    await expect(dismissedIdea.getByTestId("plan-idea-status")).toHaveText("Dismissed");

    for (const [index, [prompt, answer]] of discussAnswers.entries()) {
      await expect(window.getByTestId("plan-question-prompt")).toHaveText(prompt);
      await window.getByTestId("plan-answer-textarea").fill(answer);
      await window.getByRole("button", { name: "Save answer" }).click();

      if (index === 5) {
        await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
        await window.getByRole("button", { name: "Confirm Project" }).click();
      } else if (index === 9) {
        await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
        await window.getByRole("button", { name: "Confirm Requirements" }).click();
      }
    }

    await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
    await window.getByRole("button", { name: "Confirm Milestone" }).click();
    await expect(window.getByTestId("plan-discuss-complete")).toBeVisible();
    await window.getByRole("button", { name: "Start research" }).click();
    await expect(window.getByTestId("plan-research-panel")).toBeVisible();
    await expect(window.getByTestId("research-content-textarea")).toContainText("Research checks:");
    await window.getByTestId("research-title-input").fill("Codebase and workflow research");
    await window
      .getByTestId("research-content-textarea")
      .fill("Findings: Planning state lives in the GSD database, and research output must be accepted before PLAN.");
    await window.getByRole("button", { name: "Stage research" }).click();
    await expect(window.getByTestId("research-output-proposed")).toContainText("Codebase and workflow research");
    await window.getByRole("button", { name: "Accept" }).click();
    await expect(window.getByTestId("plan-ready-card")).toBeVisible();
    await window.getByTestId("plan-ready-card").getByRole("button", { name: "Start plan" }).click();
    await expect(window.getByTestId("plan-proposal-panel")).toBeVisible();
    await expect(window.getByTestId("plan-validation-errors").first()).toContainText("Validation passed");
    await window.getByTestId("plan-task-dependencies-input").fill("T404");
    await expect(window.getByTestId("plan-validation-errors").first()).toContainText("Unknown dependency T404");
    await window.getByRole("button", { name: "Stage plan" }).click();
    const draftPlan = window.getByTestId("plan-output-proposed").locator(".plan-research-output").filter({ hasText: "Draft" });
    await expect(draftPlan).toContainText("Unknown dependency T404");
    await expect(draftPlan.getByRole("button", { name: "Accept plan" })).toBeDisabled();
    await window.getByTestId("plan-task-dependencies-input").fill("");
    await expect(window.getByTestId("plan-validation-errors").first()).toContainText("Validation passed");
    await window.getByRole("button", { name: "Stage plan" }).click();
    const proposedPlan = window.getByTestId("plan-output-proposed").locator(".plan-research-output").filter({ hasText: "Proposed" });
    await proposedPlan.getByRole("button", { name: "Accept plan" }).click();
    await expect(window.getByTestId("plan-output-accepted")).toContainText("Plan proposal");
    await expect(window.getByTestId("projection-summary")).toContainText("Projections");
    await access(join(workspacePath, ".gsd", "PROJECT.md"));
    await access(join(workspacePath, ".gsd", "STATE.md"));
    const modificationProposal = window.getByTestId("plan-change-proposal").filter({ hasText: "Primary task acceptance update" });
    await expect(modificationProposal.getByTestId("plan-modification-form")).toBeVisible();
    await modificationProposal.getByTestId("plan-modification-task-select").selectOption("M1/S1/T1");
    await modificationProposal
      .getByTestId("plan-modification-task-acceptance-textarea")
      .fill("No lost answers, projection state, and change-control persistence are verified.");
    await modificationProposal.getByRole("button", { name: "Approve modification" }).click();
    await expect(modificationProposal.getByTestId("plan-change-proposal-status")).toHaveText("Approved");
    await expect(modificationProposal).toContainText("Modified M1/S1/T1");
    await expect(window.getByTestId("plan-output-accepted")).toContainText("Modified task - M1/S1/T1");
    const changeProposal = window.getByTestId("plan-change-proposal").filter({ hasText: "Integration change draft" });
    await expect(changeProposal.getByTestId("plan-injection-form")).toBeVisible();
    await changeProposal.getByTestId("plan-injection-task-id-input").fill("T2");
    await changeProposal.getByTestId("plan-injection-task-title-input").fill("Review integration impact");
    await changeProposal
      .getByTestId("plan-injection-task-acceptance-textarea")
      .fill("Integration impact is reviewed before execution.");
    await changeProposal.getByTestId("plan-injection-task-dependencies-input").fill("T1");
    await changeProposal.getByRole("button", { name: "Approve injection" }).click();
    await expect(changeProposal.getByTestId("plan-change-proposal-status")).toHaveText("Approved");
    await expect(changeProposal).toContainText("Injected as M1/S1/T2");
    await expect(window.getByTestId("plan-output-accepted")).toContainText("Approved change - Integration change draft");
    const injectedTaskPath = join(workspacePath, ".gsd", "milestones", "M1", "slices", "S1", "tasks", "T2-PLAN.md");
    await access(injectedTaskPath);
    await changeProposal
      .getByTestId("plan-hide-task-reason-textarea")
      .fill("Integration review moved out of the active execution path.");
    await changeProposal.getByRole("button", { name: "Hide injected task" }).click();
    await expect(changeProposal.getByTestId("plan-hidden-task-note")).toContainText("Hidden from active plan");
    await expect(window.getByTestId("plan-output-accepted")).toContainText("Hidden task - M1/S1/T2");
    await expect.poll(async () => {
      try {
        await access(injectedTaskPath);
        return "exists";
      } catch {
        return "missing";
      }
    }).toBe("missing");

    const nameMemory = window.getByTestId("plan-answer-history").locator(".plan-memory__item").filter({ hasText: "Name" });
    await nameMemory.getByRole("button", { name: "Edit" }).click();
    await window.getByTestId("plan-revision-textarea").fill("Launch Control Revised");
    await nameMemory.getByRole("button", { name: "Save revision" }).click();
    await expect(nameMemory).toContainText("Launch Control Revised");
    await window.getByTestId("regenerate-projections-button").click();
    await expect(window.getByTestId("projection-summary")).toContainText("written");

    const projectProjection = await readFile(join(workspacePath, ".gsd", "PROJECT.md"), "utf8");
    expect(projectProjection).toContain("pi-gui-plan-builder-generated");
    expect(projectProjection).toContain("# Project: Launch Control Revised");
    const roadmapProjection = await readFile(join(workspacePath, ".gsd", "milestones", "M1", "M1-ROADMAP.md"), "utf8");
    expect(roadmapProjection).toContain("Plan Builder vertical slice");
    const sliceProjection = await readFile(join(workspacePath, ".gsd", "milestones", "M1", "slices", "S1", "S1-PLAN.md"), "utf8");
    expect(sliceProjection).not.toContain("Review integration impact");
    const primaryTaskProjection = await readFile(join(workspacePath, ".gsd", "milestones", "M1", "slices", "S1", "tasks", "T1-PLAN.md"), "utf8");
    expect(primaryTaskProjection).toContain("No lost answers, projection state, and change-control persistence are verified.");
    await window.getByTestId("start-execution-button").click();
    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await expect(window.getByTestId("plan-execution-panel")).toContainText("Plan Builder vertical slice");
    await expect(window.getByTestId("plan-execution-panel")).not.toContainText("Review integration impact");
    const primaryExecutionTask = window.getByTestId("execution-task").filter({ hasText: "Implement and verify the slice" });
    await primaryExecutionTask.getByTestId("link-task-session-button").click();
    await expect(primaryExecutionTask.getByTestId("execution-task-link")).toContainText("Task T1 - Implement and verify the slice");
    let linkedSessionId = "";
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find((entry) => entry.selectedPlan?.name === "Launch plan")
        ?.selectedPlan;
      linkedSessionId = plan?.taskSessionLinks.find((link) => link.taskId === "T1")?.sessionId ?? "";
      return linkedSessionId;
    }).not.toBe("");
    await window.getByTestId("open-task-session-button").click();
    await expect.poll(async () => (await getDesktopState(window)).activeView).toBe("threads");
    await expect.poll(async () => (await getDesktopState(window)).selectedSessionId).toBe(linkedSessionId);
    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await primaryExecutionTask.getByTestId("task-status-select").selectOption("blocked");
    await primaryExecutionTask.getByTestId("task-note-textarea").fill("Implementation started in the linked session.");
    await primaryExecutionTask.getByTestId("task-blocker-textarea").fill("Waiting on schema review.");
    await primaryExecutionTask.getByTestId("update-task-execution-button").click();
    await expect(primaryExecutionTask.getByTestId("task-status-pill")).toContainText("Blocked");
    await expect(primaryExecutionTask.getByTestId("task-blocker")).toContainText("Waiting on schema review.");
    await primaryExecutionTask.getByTestId("task-status-select").selectOption("done");
    await primaryExecutionTask.getByTestId("task-note-textarea").fill("Slice implemented and checked.");
    await primaryExecutionTask.getByTestId("task-evidence-textarea").fill("Linked session created and reopened from EXECUTE.");
    await primaryExecutionTask.getByTestId("update-task-execution-button").click();
    await expect(primaryExecutionTask.getByTestId("task-status-pill")).toContainText("Done");
    await expect(primaryExecutionTask.getByTestId("task-note")).toContainText("Slice implemented and checked.");
    await expect(primaryExecutionTask.getByTestId("task-evidence-list")).toContainText("Linked session created and reopened from EXECUTE.");
    await expect(window.getByTestId("start-verify-button")).toBeEnabled();
    await window.getByTestId("start-verify-button").click();
    await expect(window.getByTestId("plan-verify-panel")).toBeVisible();
    const primaryVerifyTask = window.getByTestId("verify-task").filter({ hasText: "Implement and verify the slice" });
    await expect(primaryVerifyTask).toContainText("No lost answers, projection state, and change-control persistence are verified.");
    await expect(primaryVerifyTask).toContainText("Linked session created and reopened from EXECUTE.");
    await expect(window.getByTestId("plan-verify-panel")).not.toContainText("Review integration impact");
    await primaryVerifyTask.getByTestId("task-verification-status-select").selectOption("passed");
    await primaryVerifyTask.getByTestId("task-verification-note-textarea").fill("Acceptance matched the saved evidence.");
    await primaryVerifyTask.getByTestId("record-task-verification-button").click();
    await expect(primaryVerifyTask.getByTestId("task-verification-status")).toContainText("Passed");
    await expect(primaryVerifyTask.getByTestId("task-verification-note")).toContainText("Acceptance matched the saved evidence.");
    await expect(window.getByTestId("verify-ready-to-ship")).toBeVisible();
    await window.getByTestId("start-ship-button").click();
    await expect(window.getByTestId("plan-ship-panel")).toBeVisible();
    await expect(window.getByTestId("ship-task").filter({ hasText: "Implement and verify the slice" })).toContainText("Implement and verify the slice");
    await expect(window.getByTestId("plan-ship-panel")).not.toContainText("Review integration impact");
    await expect(window.getByTestId("ship-task").filter({ hasText: "Implement and verify the slice" }).getByTestId("ship-evidence-list")).toContainText("Linked session created and reopened from EXECUTE.");
    await window.getByTestId("ship-summary-textarea").fill("Ship handoff: Launch plan verified with persisted evidence.");
    await window.getByTestId("record-ship-summary-button").click();
    await expect(window.getByTestId("ship-summary-recorded")).toContainText("Ship handoff: Launch plan verified with persisted evidence.");
    await access(join(workspacePath, ".gsd", "gsd.db"));
  } finally {
    await harness.close();
  }

  harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Launch plan");
    await expect(window.getByTestId("workflow-preferences-card")).toContainText("Workflow preferences saved");
    await expect(window.getByTestId("plan-ship-panel")).toBeVisible();
    await expect(window.getByTestId("ship-task").filter({ hasText: "Implement and verify the slice" })).toContainText("Implement and verify the slice");
    await expect(window.getByTestId("plan-ship-panel")).not.toContainText("Review integration impact");
    await expect(window.getByTestId("ship-task").filter({ hasText: "Implement and verify the slice" }).getByTestId("ship-evidence-list")).toContainText("Linked session created and reopened from EXECUTE.");
    await expect(window.getByTestId("ship-task").filter({ hasText: "Implement and verify the slice" }).getByTestId("ship-verification-note")).toContainText("Acceptance matched the saved evidence.");
    await expect(window.getByTestId("ship-summary-recorded")).toContainText("Ship handoff: Launch plan verified with persisted evidence.");
    await expect(
      window.getByTestId("plan-idea-item").filter({ hasText: "Later automation follow-up" }).getByTestId("plan-idea-status"),
    ).toHaveText("Kept");
    await expect(
      window.getByTestId("plan-idea-item").filter({ hasText: "Prepare integration change" }).getByTestId("plan-idea-status"),
    ).toHaveText("Ready to promote");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Integration change draft");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Injected as M1/S1/T2");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Hidden from active plan");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Primary task acceptance update");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Modified M1/S1/T1");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Impact: review roadmap boundaries");
    await expect(
      window.getByTestId("plan-idea-item").filter({ hasText: "Drop onboarding banner" }).getByTestId("plan-idea-status"),
    ).toHaveText("Dismissed");
    await expect(window.getByTestId("plan-answer-history")).toContainText("Launch Control Revised");
    const persistedProjectProjection = await readFile(join(workspacePath, ".gsd", "PROJECT.md"), "utf8");
    expect(persistedProjectProjection).toContain("# Project: Launch Control Revised");
    await expect.poll(async () =>
      Object.values((await getDesktopState(window)).planningByWorkspace).some(
        (entry) =>
          entry.selectedPlan?.name === "Launch plan" &&
          entry.selectedPlan.activePhase === "ship" &&
          entry.selectedPlan.workflowPreferences?.commitPolicy === "per-task" &&
          entry.selectedPlan.workflowPreferences?.branchModel === "single" &&
          entry.selectedPlan.workflowPreferences?.models.executorClass === "balanced" &&
          entry.selectedPlan.parkedItems.some(
            (item) => item.text === "Later automation follow-up" && item.reviewStatus === "kept",
          ) &&
          entry.selectedPlan.parkedItems.some(
            (item) => item.text === "Prepare integration change" && item.reviewStatus === "promotion-ready",
          ) &&
          entry.selectedPlan.parkedItems.some(
            (item) => item.text === "Tighten primary task acceptance" && item.reviewStatus === "promotion-ready",
          ) &&
          entry.selectedPlan.changeProposals.some(
            (proposal) =>
              proposal.title === "Integration change draft" &&
              proposal.status === "approved" &&
              proposal.impactNotes.includes("review roadmap boundaries") &&
              proposal.injectedTaskPath === "M1/S1/T2",
          ) &&
          entry.selectedPlan.changeProposals.some(
            (proposal) =>
              proposal.title === "Primary task acceptance update" &&
              proposal.status === "approved" &&
              proposal.modifiedTaskPath === "M1/S1/T1",
          ) &&
          entry.selectedPlan.approvedInjections.some(
            (injection) =>
              injection.taskId === "T2" &&
              injection.taskPath === "M1/S1/T2" &&
              injection.title === "Review integration impact",
          ) &&
          entry.selectedPlan.approvedModifications.some(
            (modification) =>
              modification.taskPath === "M1/S1/T1" &&
              modification.previousAcceptance === "No lost answers, clear stage state, and revision-safe writes." &&
              modification.acceptance ===
                "No lost answers, projection state, and change-control persistence are verified.",
          ) &&
          entry.selectedPlan.hiddenPlanItems.some(
            (item) =>
              item.targetType === "task" &&
              item.targetId === "T2" &&
              item.targetPath === "M1/S1/T2" &&
              item.reason === "Integration review moved out of the active execution path.",
          ) &&
          entry.selectedPlan.parkedItems.some(
            (item) => item.text === "Drop onboarding banner" && item.reviewStatus === "dismissed",
          ) &&
          entry.selectedPlan.taskSessionLinks.some((link) => link.taskId === "T1" && link.sessionId.length > 0) &&
          entry.selectedPlan.taskExecutions.some(
            (task) =>
              task.taskId === "T1" &&
              task.status === "done" &&
              task.evidence.some((evidence) => evidence.text === "Linked session created and reopened from EXECUTE."),
          ) &&
          entry.selectedPlan.taskVerifications.some(
            (task) =>
              task.taskId === "T1" &&
              task.status === "passed" &&
              task.note === "Acceptance matched the saved evidence.",
          ) &&
          entry.selectedPlan.shipSummaries.some(
            (summary) => summary.summary === "Ship handoff: Launch plan verified with persisted evidence.",
          ) &&
          entry.selectedPlan.generatedOutputs.some(
            (output) =>
              output.stage === "research" &&
              output.status === "accepted" &&
              output.title === "Codebase and workflow research",
          ) &&
          entry.selectedPlan.generatedOutputs.some(
            (output) =>
              output.stage === "roadmap" &&
              output.status === "accepted" &&
              output.title === "Plan proposal",
          ) &&
          entry.selectedPlan.generatedOutputs.some(
            (output) =>
              output.stage === "roadmap" &&
              output.status === "accepted" &&
              output.title === "Approved change - Integration change draft" &&
              output.content.includes("Review integration impact"),
          ) &&
          entry.selectedPlan.generatedOutputs.some(
            (output) =>
              output.stage === "roadmap" &&
              output.status === "accepted" &&
              output.title === "Modified task - M1/S1/T1" &&
              output.content.includes("change-control persistence are verified"),
          ) &&
          entry.selectedPlan.generatedOutputs.some(
            (output) =>
              output.stage === "roadmap" &&
              output.status === "accepted" &&
              output.title === "Hidden task - M1/S1/T2" &&
              !output.content.includes("Review integration impact"),
          ),
      ),
    ).toBe(true);
  } finally {
    await harness.close();
  }
});
