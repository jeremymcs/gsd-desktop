import { access } from "node:fs/promises";
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

test("persists DISCUSS answers, revisions, and depth gates across restart", async () => {
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

    const nameMemory = window.getByTestId("plan-answer-history").locator(".plan-memory__item").filter({ hasText: "Name" });
    await nameMemory.getByRole("button", { name: "Edit" }).click();
    await window.getByTestId("plan-revision-textarea").fill("Launch Control Revised");
    await nameMemory.getByRole("button", { name: "Save revision" }).click();
    await expect(nameMemory).toContainText("Launch Control Revised");
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
    await expect(window.getByTestId("plan-discuss-complete")).toBeVisible();
    await expect(window.getByTestId("plan-answer-history")).toContainText("Launch Control Revised");
    await expect.poll(async () =>
      Object.values((await getDesktopState(window)).planningByWorkspace).some(
        (entry) => entry.selectedPlan?.name === "Launch plan",
      ),
    ).toBe(true);
  } finally {
    await harness.close();
  }
});
