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
    await window.getByTestId("start-execution-button").click();
    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await expect(window.getByTestId("plan-execution-panel")).toContainText("Plan Builder vertical slice");
    await expect(window.getByTestId("execution-task")).toContainText("Implement and verify the slice");
    await window.getByTestId("link-task-session-button").click();
    await expect(window.getByTestId("execution-task-link")).toContainText("Task T1 - Implement and verify the slice");
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
    await window.getByTestId("task-status-select").selectOption("blocked");
    await window.getByTestId("task-note-textarea").fill("Implementation started in the linked session.");
    await window.getByTestId("task-blocker-textarea").fill("Waiting on schema review.");
    await window.getByTestId("update-task-execution-button").click();
    await expect(window.getByTestId("task-status-pill")).toContainText("Blocked");
    await expect(window.getByTestId("task-blocker")).toContainText("Waiting on schema review.");
    await window.getByTestId("task-status-select").selectOption("done");
    await window.getByTestId("task-note-textarea").fill("Slice implemented and checked.");
    await window.getByTestId("task-evidence-textarea").fill("Linked session created and reopened from EXECUTE.");
    await window.getByTestId("update-task-execution-button").click();
    await expect(window.getByTestId("task-status-pill")).toContainText("Done");
    await expect(window.getByTestId("task-note")).toContainText("Slice implemented and checked.");
    await expect(window.getByTestId("task-evidence-list")).toContainText("Linked session created and reopened from EXECUTE.");
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
    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await expect(window.getByTestId("plan-execution-panel")).toContainText("Plan Builder vertical slice");
    await expect(window.getByTestId("execution-task-link")).toContainText("Task T1 - Implement and verify the slice");
    await expect(window.getByTestId("task-status-pill")).toContainText("Done");
    await expect(window.getByTestId("task-evidence-list")).toContainText("Linked session created and reopened from EXECUTE.");
    await expect(window.getByTestId("plan-answer-history")).toContainText("Launch Control Revised");
    const persistedProjectProjection = await readFile(join(workspacePath, ".gsd", "PROJECT.md"), "utf8");
    expect(persistedProjectProjection).toContain("# Project: Launch Control Revised");
    await expect.poll(async () =>
      Object.values((await getDesktopState(window)).planningByWorkspace).some(
        (entry) =>
          entry.selectedPlan?.name === "Launch plan" &&
          entry.selectedPlan.activePhase === "execute" &&
          entry.selectedPlan.taskSessionLinks.some((link) => link.taskId === "T1" && link.sessionId.length > 0) &&
          entry.selectedPlan.taskExecutions.some(
            (task) =>
              task.taskId === "T1" &&
              task.status === "done" &&
              task.evidence.some((evidence) => evidence.text === "Linked session created and reopened from EXECUTE."),
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
          ),
      ),
    ).toBe(true);
  } finally {
    await harness.close();
  }
});
