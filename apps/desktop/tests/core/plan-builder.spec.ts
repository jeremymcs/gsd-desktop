import { access, readFile } from "node:fs/promises";
import { basename } from "node:path";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
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
  ["Is this project simple or complex?", "complex - database-backed planning, projections, and execution lifecycle state."],
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

const projectDepthGatePrompt = "What constraints should shape every decision?";
const requirementsDepthGatePrompt = "How should we know the requirements are complete enough to plan?";

async function completeDiscussFromQuestionCard(window: Page): Promise<void> {
  for (const [prompt, answer] of discussAnswers) {
    await expect(window.getByTestId("plan-question-prompt")).toHaveText(prompt);
    await window.getByTestId("plan-answer-textarea").fill(answer);
    await window.getByTestId("plan-question-card").getByRole("button", { name: "Save answer" }).click();

    if (prompt === projectDepthGatePrompt) {
      await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
      await window.getByRole("button", { name: "Confirm Project" }).click();
    } else if (prompt === requirementsDepthGatePrompt) {
      await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
      await window.getByRole("button", { name: "Confirm Requirements" }).click();
    }
  }

  await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
  await window.getByRole("button", { name: "Confirm Milestone" }).click();
  await expect(window.getByTestId("plan-discuss-complete")).toBeVisible();
}

async function createAcceptedPlanFromQuestionCards(window: Page, planName: string): Promise<void> {
  await window.getByRole("button", { name: "Plans", exact: true }).click();
  await window.getByTestId("plan-name-input").fill(planName);
  await window.getByRole("button", { name: "Create plan" }).click();
  await completeDiscussFromQuestionCard(window);
  await window.getByRole("button", { name: "Start research" }).click();
  await window.getByTestId("research-title-input").fill(`${planName} research`);
  await window.getByTestId("research-content-textarea").fill("Research accepted before composer completion handoff.");
  await window.getByRole("button", { name: "Stage research" }).click();
  await window.getByTestId("research-output-proposed").getByRole("button", { name: "Accept" }).click();
  await window.getByTestId("plan-ready-card").getByRole("button", { name: "Start plan" }).click();
  await expect(window.getByTestId("plan-validation-errors").first()).toContainText("Validation passed");
  await window.getByRole("button", { name: "Stage plan" }).click();
  await window
    .getByTestId("plan-output-proposed")
    .locator(".plan-research-output")
    .filter({ hasText: "Proposed" })
    .getByRole("button", { name: "Accept plan" })
    .click();
  await expect(window.getByTestId("plan-output-accepted")).toContainText("Plan proposal");
}

async function saveDoneExecutionEvidenceForAllTasks(window: Page): Promise<void> {
  const tasks = window.getByTestId("execution-task");
  await expect(tasks.first()).toBeVisible();
  const taskCount = await tasks.count();
  expect(taskCount).toBeGreaterThan(0);

  for (let index = 0; index < taskCount; index += 1) {
    const task = tasks.nth(index);
    await task.getByTestId("task-status-select").selectOption("done");
    await task.getByTestId("task-note-textarea").fill(`Task ${index + 1} completed.`);
    await task.getByTestId("task-evidence-textarea").fill(`Evidence ${index + 1} saved from EXECUTE.`);
    await task.getByTestId("update-task-execution-button").click();
    await expect(task.getByTestId("task-status-pill")).toContainText("Done");
  }
}

async function savePassedVerificationForAllTasks(window: Page): Promise<void> {
  const tasks = window.getByTestId("verify-task");
  await expect(tasks.first()).toBeVisible();
  const taskCount = await tasks.count();
  expect(taskCount).toBeGreaterThan(0);

  for (let index = 0; index < taskCount; index += 1) {
    const task = tasks.nth(index);
    await task.getByTestId("task-verification-status-select").selectOption("passed");
    await task.getByTestId("task-verification-note-textarea").fill(`Verification ${index + 1} passed.`);
    await task.getByTestId("record-task-verification-button").click();
    await expect(task.getByTestId("task-verification-status")).toContainText("Passed");
  }
}

async function contrastRatioFor(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    type Rgba = { r: number; g: number; b: number; a: number };

    const parseColor = (value: string): Rgba | null => {
      const parts = value.match(/[\d.]+/g)?.map(Number);
      if (!parts || parts.length < 3) {
        return null;
      }
      return {
        r: parts[0] ?? 0,
        g: parts[1] ?? 0,
        b: parts[2] ?? 0,
        a: parts[3] ?? 1,
      };
    };

    const composite = (top: Rgba, bottom: Rgba): Rgba => {
      const alpha = top.a + bottom.a * (1 - top.a);
      if (alpha === 0) {
        return { r: 0, g: 0, b: 0, a: 0 };
      }
      return {
        r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha,
        g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha,
        b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha,
        a: alpha,
      };
    };

    const relativeLuminance = (color: Rgba) =>
      [color.r, color.g, color.b]
        .map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);

    const foreground = parseColor(getComputedStyle(element).color);
    let background: Rgba = { r: 255, g: 255, b: 255, a: 1 };
    const backgroundLayers: Rgba[] = [];
    let node: Element | null = element;
    while (node) {
      const parsed = parseColor(getComputedStyle(node).backgroundColor);
      if (parsed && parsed.a > 0) {
        backgroundLayers.push(parsed);
      }
      node = node.parentElement;
    }

    for (const layer of backgroundLayers.reverse()) {
      background = composite(layer, background);
    }

    if (!foreground) {
      return 0;
    }
    const foregroundLuminance = relativeLuminance(foreground);
    const backgroundLuminance = relativeLuminance(background);
    const lighter = Math.max(foregroundLuminance, backgroundLuminance);
    const darker = Math.min(foregroundLuminance, backgroundLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  });
}

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
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("QUESTIONING / project");
    await expect(window.getByTestId("workflow-guidance-next-action")).toContainText("Create a plan");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("guided-discuss-project.md");
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

test("keeps Plan Builder workflow controls readable in light and dark themes", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-theme");
  const workspaceName = basename(workspacePath);

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(window.getByTestId("plan-builder-title")).toHaveText(`Build a plan for ${workspaceName}`);
    await window.getByTestId("plan-name-input").fill("Theme plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await expect(window.getByTestId("workflow-preferences-card")).toContainText("Workflow preferences");
    await window.getByTestId("apply-workflow-preferences-button").click();
    await expect(window.getByTestId("phase-model-select-execute")).toBeVisible();

    const readableTargets = [
      { name: "plan title", locator: window.getByTestId("plan-builder-title") },
      { name: "answer textarea", locator: window.getByTestId("plan-answer-textarea") },
      { name: "phase model select", locator: window.getByTestId("phase-model-select-execute") },
      {
        name: "workflow preference summary",
        locator: window.getByTestId("workflow-preferences-summary"),
      },
      { name: "prompt source", locator: window.getByTestId("workflow-guidance-prompt-source") },
    ] as const;
    const expectReadableContrast = async (theme: "light" | "dark") => {
      await window.evaluate((nextTheme) => {
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
      }, theme);
      for (const target of readableTargets) {
        await expect
          .poll(() => contrastRatioFor(target.locator), { message: `${target.name} contrast in ${theme} theme` })
          .toBeGreaterThanOrEqual(4.5);
      }
    };

    await expectReadableContrast("light");
    await expectReadableContrast("dark");
  } finally {
    await harness.close();
  }
});

test("resolves saved follow-up guidance through answer revision", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-follow-up-resolution");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Follow-up resolution plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await expect(window.getByTestId("plan-question-prompt")).toHaveText("What should we call this project?");
    await window.getByTestId("plan-answer-textarea").fill("not sure");
    await window.getByRole("button", { name: "Save answer" }).click();

    const nameMemory = window.getByTestId("plan-answer-history").locator(".plan-memory__item").filter({ hasText: "Name" });
    await expect(window.getByTestId("adaptive-guidance-rollup-summary")).toContainText("1 unresolved");
    await expect(nameMemory.getByTestId("plan-memory-question")).toHaveText("What should we call this project?");
    await expect(nameMemory.getByTestId("adaptive-follow-up")).toContainText("Suggested follow-up");
    await expect(nameMemory.getByTestId("adaptive-follow-up-action")).toHaveText("Edit answer");
    await nameMemory.getByTestId("adaptive-follow-up-action").click();
    await expect(nameMemory.getByTestId("plan-revision-textarea")).toHaveValue("not sure");
    await nameMemory.getByTestId("plan-revision-textarea").fill("Resolved launch plan");
    await nameMemory.getByRole("button", { name: "Save revision" }).click();

    await expect(nameMemory).toContainText("Resolved launch plan");
    await expect(nameMemory.getByTestId("adaptive-follow-up")).toHaveCount(0);
    await expect(window.getByTestId("adaptive-guidance-rollup")).toHaveCount(0);
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Follow-up resolution plan",
      )?.selectedPlan;
      const titleAnswers = plan?.answers.filter((answer) => answer.questionId === "project_title") ?? [];
      return {
        hasFollowUpPrompt:
          plan?.answers.some((answer) => answer.answer.includes("What name would you recognize")) ?? false,
        revisedAnswer: titleAnswers.at(-1)?.answer ?? "",
      };
    }).toEqual({
      hasFollowUpPrompt: false,
      revisedAnswer: "Resolved launch plan",
    });
  } finally {
    await harness.close();
  }
});

test("saves the active DISCUSS answer from the Plan Builder composer", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-answer");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Composer answer plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await expect(window.getByTestId("plan-question-prompt")).toHaveText("What should we call this project?");
    await window.getByTestId("plan-composer-textarea").fill("Composer Driven Plan");
    await expect(window.getByTestId("plan-answer-textarea")).toHaveValue("Composer Driven Plan");
    await window.getByLabel("Submit composer answer").click();

    await expect(window.getByTestId("plan-question-prompt")).toHaveText(
      "What are we building, and what outcome should it create?",
    );
    await expect(window.getByTestId("plan-answer-history")).toContainText("Composer Driven Plan");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer answer plan",
      )?.selectedPlan;
      const answer = plan?.answers.find((entry) => entry.questionId === "project_title");
      return {
        answer: answer?.answer ?? "",
        prompt: answer?.prompt ?? "",
        loadBearing: answer?.loadBearing ?? false,
      };
    }).toEqual({
      answer: "Composer Driven Plan",
      prompt: "What should we call this project?",
      loadBearing: true,
    });
  } finally {
    await harness.close();
  }
});

test("keeps the active DISCUSS question visible inside the Plan Builder composer", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-question-context");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Composer question context plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await expect(window.getByTestId("plan-composer-question")).toHaveText("What should we call this project?");
    await window.getByTestId("plan-composer-textarea").fill("Question Stays Visible");
    await expect(window.getByTestId("plan-composer-question")).toHaveText("What should we call this project?");
    await window.getByLabel("Submit composer answer").click();

    await expect(window.getByTestId("plan-composer-question")).toHaveText(
      "What are we building, and what outcome should it create?",
    );
  } finally {
    await harness.close();
  }
});

test("keeps focus in the Plan Builder composer after submit and park", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-focus");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Composer focus plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await window.getByTestId("plan-composer-textarea").fill("Focus stays on composer");
    await window.getByLabel("Submit composer answer").click();

    await expect(window.getByTestId("plan-question-prompt")).toHaveText(
      "What are we building, and what outcome should it create?",
    );
    await expect(window.getByTestId("plan-composer-textarea")).toBeFocused();
    await window.getByTestId("plan-composer-textarea").fill("Park this composer draft");
    await window.getByRole("button", { name: "Move composer draft to idea pool" }).click();

    await expect(window.getByTestId("plan-question-prompt")).toHaveText(
      "What are we building, and what outcome should it create?",
    );
    await expect(window.getByTestId("plan-composer-textarea")).toBeFocused();
  } finally {
    await harness.close();
  }
});

test("submits the active DISCUSS answer from the Plan Builder composer keyboard shortcut", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-keyboard");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Composer keyboard plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await window.getByTestId("plan-composer-textarea").fill("Keyboard Shortcut Plan");
    await window.getByTestId("plan-composer-textarea").press("Control+Enter");

    await expect(window.getByTestId("plan-question-prompt")).toHaveText(
      "What are we building, and what outcome should it create?",
    );
    await expect(window.getByTestId("plan-answer-history")).toContainText("Keyboard Shortcut Plan");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer keyboard plan",
      )?.selectedPlan;
      const answer = plan?.answers.find((entry) => entry.questionId === "project_title");
      return {
        answer: answer?.answer ?? "",
        loadBearing: answer?.loadBearing ?? false,
      };
    }).toEqual({
      answer: "Keyboard Shortcut Plan",
      loadBearing: true,
    });
  } finally {
    await harness.close();
  }
});

test("starts RESEARCH from the Plan Builder composer handoff", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-start-research");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Composer research handoff plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await completeDiscussFromQuestionCard(window);
    await expect(window.getByText("Start research when you are ready to stage findings")).toBeVisible();
    await window.getByLabel("Advance composer to RESEARCH").click();

    await expect(window.getByTestId("plan-research-panel")).toBeVisible();
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer research handoff plan",
      )?.selectedPlan;
      return {
        activePhase: plan?.activePhase ?? "",
        activeStage: plan?.activeStage ?? "",
      };
    }).toEqual({
      activePhase: "research",
      activeStage: "research",
    });
  } finally {
    await harness.close();
  }
});

test("starts PLAN from the Plan Builder composer handoff", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-start-plan");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Composer plan handoff plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await completeDiscussFromQuestionCard(window);
    await window.getByRole("button", { name: "Start research" }).click();
    await expect(window.getByTestId("plan-research-panel")).toBeVisible();
    await window.getByTestId("research-title-input").fill("Composer handoff research");
    await window.getByTestId("research-content-textarea").fill("Research accepted before composer PLAN handoff.");
    await window.getByRole("button", { name: "Stage research" }).click();
    await window.getByTestId("research-output-proposed").getByRole("button", { name: "Accept" }).click();
    await expect(window.getByTestId("plan-ready-card")).toBeVisible();
    await expect(window.getByText("Start PLAN when you are ready to structure the roadmap")).toBeVisible();
    await window.getByLabel("Advance composer to PLAN").click();

    await expect(window.getByTestId("plan-proposal-panel")).toBeVisible();
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer plan handoff plan",
      )?.selectedPlan;
      return {
        activePhase: plan?.activePhase ?? "",
        activeStage: plan?.activeStage ?? "",
      };
    }).toEqual({
      activePhase: "plan",
      activeStage: "roadmap",
    });
  } finally {
    await harness.close();
  }
});

test("starts EXECUTE from the Plan Builder composer handoff", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-start-execute");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Composer execute handoff plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await completeDiscussFromQuestionCard(window);
    await window.getByRole("button", { name: "Start research" }).click();
    await window.getByTestId("research-title-input").fill("Composer execute research");
    await window.getByTestId("research-content-textarea").fill("Research accepted before composer EXECUTE handoff.");
    await window.getByRole("button", { name: "Stage research" }).click();
    await window.getByTestId("research-output-proposed").getByRole("button", { name: "Accept" }).click();
    await window.getByTestId("plan-ready-card").getByRole("button", { name: "Start plan" }).click();
    await expect(window.getByTestId("plan-validation-errors").first()).toContainText("Validation passed");
    await window.getByRole("button", { name: "Stage plan" }).click();
    await window
      .getByTestId("plan-output-proposed")
      .locator(".plan-research-output")
      .filter({ hasText: "Proposed" })
      .getByRole("button", { name: "Accept plan" })
      .click();
    await expect(window.getByTestId("plan-output-accepted")).toContainText("Plan proposal");
    await expect(window.getByText("Start EXECUTE when the accepted plan is ready for task work")).toBeVisible();
    await window.getByLabel("Advance composer to EXECUTE").click();

    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer execute handoff plan",
      )?.selectedPlan;
      return {
        activePhase: plan?.activePhase ?? "",
        activeStage: plan?.activeStage ?? "",
      };
    }).toEqual({
      activePhase: "execute",
      activeStage: "task",
    });
  } finally {
    await harness.close();
  }
});

test("starts VERIFY from the Plan Builder composer handoff", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-start-verify");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await createAcceptedPlanFromQuestionCards(window, "Composer verify handoff plan");
    await window.getByTestId("start-execution-button").click();
    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await expect(window.getByText("Complete every EXECUTE task with evidence before VERIFY")).toBeVisible();
    await expect(window.getByLabel("Advance composer to VERIFY")).toHaveCount(0);

    await saveDoneExecutionEvidenceForAllTasks(window);
    await expect(window.getByText("Start VERIFY when all task evidence is ready")).toBeVisible();
    await window.getByLabel("Advance composer to VERIFY").click();

    await expect(window.getByTestId("plan-verify-panel")).toBeVisible();
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer verify handoff plan",
      )?.selectedPlan;
      return {
        activePhase: plan?.activePhase ?? "",
        activeStage: plan?.activeStage ?? "",
      };
    }).toEqual({
      activePhase: "verify",
      activeStage: "task",
    });
  } finally {
    await harness.close();
  }
});

test("starts SHIP from the Plan Builder composer handoff", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-start-ship");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await createAcceptedPlanFromQuestionCards(window, "Composer ship handoff plan");
    await window.getByTestId("start-execution-button").click();
    await saveDoneExecutionEvidenceForAllTasks(window);
    await window.getByLabel("Advance composer to VERIFY").click();
    await expect(window.getByTestId("plan-verify-panel")).toBeVisible();
    await expect(window.getByText("Pass every VERIFY task before SHIP")).toBeVisible();
    await expect(window.getByLabel("Advance composer to SHIP")).toHaveCount(0);

    await savePassedVerificationForAllTasks(window);
    await expect(window.getByText("Start SHIP when all task verifications pass")).toBeVisible();
    await window.getByLabel("Advance composer to SHIP").click();

    await expect(window.getByTestId("plan-ship-panel")).toBeVisible();
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer ship handoff plan",
      )?.selectedPlan;
      return {
        activePhase: plan?.activePhase ?? "",
        activeStage: plan?.activeStage ?? "",
      };
    }).toEqual({
      activePhase: "ship",
      activeStage: "task",
    });
  } finally {
    await harness.close();
  }
});

test("parks the active DISCUSS draft from the Plan Builder composer", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-park");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Composer park plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await expect(window.getByTestId("plan-question-prompt")).toHaveText("What should we call this project?");
    await window.getByTestId("plan-composer-textarea").fill("Revisit naming after research");
    await expect(window.getByTestId("plan-answer-textarea")).toHaveValue("Revisit naming after research");
    await window.getByRole("button", { name: "Move composer draft to idea pool" }).click();

    await expect(window.getByTestId("plan-question-prompt")).toHaveText("What should we call this project?");
    await expect(window.getByTestId("plan-answer-textarea")).toHaveValue("");
    await expect(window.getByTestId("plan-composer-textarea")).toHaveValue("");
    await expect(window.getByTestId("plan-idea-pool")).toContainText("Revisit naming after research");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer park plan",
      )?.selectedPlan;
      const answer = plan?.answers.find((entry) => entry.questionId === "project_title");
      const item = plan?.parkedItems.find((entry) => entry.sourceQuestionId === "project_title");
      return {
        answer: answer?.answer ?? "",
        loadBearing: answer?.loadBearing ?? true,
        parkedText: item?.text ?? "",
        reviewStatus: item?.reviewStatus ?? "",
      };
    }).toEqual({
      answer: "Revisit naming after research",
      loadBearing: false,
      parkedText: "Revisit naming after research",
      reviewStatus: "parked",
    });
  } finally {
    await harness.close();
  }
});

test("restores composer-submitted answers and parked drafts across restart", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-restart");

  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Composer restart plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await expect(window.getByTestId("plan-question-prompt")).toHaveText("What should we call this project?");
    await window.getByTestId("plan-composer-textarea").fill("Composer Restart Plan");
    await window.getByLabel("Submit composer answer").click();

    await expect(window.getByTestId("plan-question-prompt")).toHaveText(
      "What are we building, and what outcome should it create?",
    );
    await window.getByTestId("plan-composer-textarea").fill("Park restart-risk cleanup for later");
    await window.getByRole("button", { name: "Move composer draft to idea pool" }).click();
    await expect(window.getByTestId("plan-idea-pool")).toContainText("Park restart-risk cleanup for later");
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
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Composer restart plan");
    await expect(window.getByTestId("plan-answer-history")).toContainText("Composer Restart Plan");
    await expect(window.getByTestId("plan-idea-pool")).toContainText("Park restart-risk cleanup for later");
    await expect(window.getByTestId("plan-question-prompt")).toHaveText(
      "What are we building, and what outcome should it create?",
    );
    await expect(window.getByTestId("plan-composer-textarea")).toHaveValue("");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer restart plan",
      )?.selectedPlan;
      return {
        answerCount: plan?.answers.length ?? -1,
        parkedCount: plan?.parkedItems.length ?? -1,
        savedAnswer: plan?.answers.find((entry) => entry.questionId === "project_title" && entry.loadBearing)
          ?.answer ?? "",
        parkedAnswer: plan?.answers.find((entry) => entry.questionId === "project_vision" && !entry.loadBearing)
          ?.answer ?? "",
        parkedText: plan?.parkedItems[0]?.text ?? "",
        activeQuestionId: plan?.stages.find((entry) => entry.stage === "project")?.activeQuestionId ?? "",
      };
    }).toEqual({
      answerCount: 2,
      parkedCount: 1,
      savedAnswer: "Composer Restart Plan",
      parkedAnswer: "Park restart-risk cleanup for later",
      parkedText: "Park restart-risk cleanup for later",
      activeQuestionId: "project_vision",
    });
  } finally {
    await harness.close();
  }
});

test("labels weak requirements answers with requirement contract context", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-requirement-guidance");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Requirement guidance plan");
    await window.getByRole("button", { name: "Create plan" }).click();

    for (const [prompt, answer] of discussAnswers.slice(0, 7)) {
      await expect(window.getByTestId("plan-question-prompt")).toHaveText(prompt);
      await window.getByTestId("plan-answer-textarea").fill(answer);
      await window.getByRole("button", { name: "Save answer" }).click();

      if (prompt === projectDepthGatePrompt) {
        await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
        await window.getByRole("button", { name: "Confirm Project" }).click();
      }
    }

    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("REQUIREMENTS");
    await expect(window.getByTestId("plan-question-prompt")).toHaveText(
      "What must the first useful version be able to do?",
    );
    await window.getByTestId("plan-answer-textarea").fill("yes");
    await window.getByRole("button", { name: "Save answer" }).click();

    const capabilitiesMemory = window
      .getByTestId("plan-answer-history")
      .locator(".plan-memory__item")
      .filter({ hasText: "Capabilities" });
    const requirementsRollup = window
      .getByTestId("adaptive-guidance-rollup-item")
      .filter({ hasText: "DISCUSS / Requirements" });
    await expect(window.getByTestId("adaptive-guidance-rollup-summary")).toContainText("1 unresolved");
    await expect(requirementsRollup.getByTestId("adaptive-guidance-rollup-count")).toHaveText("1 medium");
    await expect(requirementsRollup.getByTestId("adaptive-guidance-rollup-signals")).toContainText("R001");
    await expect(window.getByTestId("requirements-contract")).toContainText("R001: First useful version capabilities");
    await expect(capabilitiesMemory.getByTestId("adaptive-follow-up-severity")).toHaveText("Medium signal");
    await expect(capabilitiesMemory.getByTestId("adaptive-follow-up-signals")).toContainText("R001");
    await expect(capabilitiesMemory.getByTestId("adaptive-follow-up-signals")).toContainText("functional requirement");
    await expect(capabilitiesMemory.getByTestId("adaptive-follow-up-signals")).toContainText("unvalidated");
    await expect(capabilitiesMemory.getByTestId("adaptive-follow-up-rationale")).toHaveText(
      "This answer feeds R001. Tighten the functional requirement before it steers PLAN.",
    );
  } finally {
    await harness.close();
  }
});

test("requires research override and repeats unresolved guidance before planning", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-readiness-warning");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Readiness warning plan");
    await window.getByRole("button", { name: "Create plan" }).click();

    const answersWithUnresolvedGuidance = [
      ["What should we call this project?", "not sure"],
      ...discussAnswers.slice(1),
    ] as const;
    const savedAnswerCount = answersWithUnresolvedGuidance.length;

    for (const [prompt, answer] of answersWithUnresolvedGuidance) {
      await expect(window.getByTestId("plan-question-prompt")).toHaveText(prompt);
      await window.getByTestId("plan-answer-textarea").fill(answer);
      await window.getByRole("button", { name: "Save answer" }).click();

      if (prompt === projectDepthGatePrompt) {
        await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
        await window.getByRole("button", { name: "Confirm Project" }).click();
      } else if (prompt === requirementsDepthGatePrompt) {
        await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
        await window.getByRole("button", { name: "Confirm Requirements" }).click();
      }
    }

    await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
    await window.getByRole("button", { name: "Confirm Milestone" }).click();
    await expect(window.getByTestId("plan-discuss-complete")).toBeVisible();
    await expect(window.getByTestId("plan-readiness-warning")).toContainText("1 unresolved guidance item");
    await expect(window.getByTestId("plan-readiness-warning")).toContainText(
      "High-signal answers should be revised before later phases rely on them.",
    );
    await expect(window.getByTestId("plan-readiness-warning-stages")).toContainText("DISCUSS / Project");
    await expect(window.getByRole("button", { name: "Start research" })).toBeDisabled();
    await window.getByTestId("plan-readiness-override-checkbox").check();
    await expect(window.getByRole("button", { name: "Start research" })).toBeEnabled();
    await window.getByRole("button", { name: "Start research" }).click();
    await expect(window.getByTestId("plan-research-panel")).toBeVisible();
    await window.getByTestId("research-title-input").fill("Readiness research");
    await window.getByTestId("research-content-textarea").fill("Findings: unresolved guidance remains visible at handoff gates.");
    await window.getByRole("button", { name: "Stage research" }).click();
    await window.getByTestId("research-output-proposed").getByRole("button", { name: "Accept" }).click();
    await expect(window.getByTestId("plan-ready-card")).toBeVisible();
    await expect(window.getByTestId("plan-ready-card").getByTestId("plan-readiness-warning")).toContainText(
      "1 unresolved guidance item",
    );
    await expect(window.getByTestId("plan-ready-card").getByRole("button", { name: "Start plan" })).toBeEnabled();
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Readiness warning plan",
      )?.selectedPlan;
      return {
        answerCount: plan?.answers.length ?? 0,
        hasFollowUpPrompt:
          plan?.answers.some((answer) => answer.answer.includes("What name would you recognize")) ?? false,
      };
    }).toEqual({
      answerCount: savedAnswerCount,
      hasFollowUpPrompt: false,
    });
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

    await window.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(window.getByTestId("settings-surface")).toBeVisible();
    await window.getByRole("button", { name: "Models", exact: true }).click();
    await expect(window.getByTestId("global-phase-model-select-discuss")).toBeVisible();
    await window.getByTestId("global-phase-model-select-discuss").selectOption("openai:gpt-5");
    await window.getByTestId("global-phase-model-select-research").selectOption("openai:gpt-4o");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      return [
        state.globalPlanningPreferences.phaseModels.discuss?.modelId,
        state.globalPlanningPreferences.phaseModels.research?.modelId,
      ].join(":");
    }).toBe("gpt-5:gpt-4o");

    await window.getByRole("button", { name: "Back to app", exact: true }).click();
    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(window.getByTestId("plan-builder-title")).toHaveText(`Build a plan for ${workspaceName}`);
    await window.getByTestId("plan-name-input").fill("Launch plan");
    await window.getByRole("button", { name: "Create plan" }).click();
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Launch plan");
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("QUESTIONING / project");
    await expect(window.getByTestId("workflow-guidance-next-action")).toContainText("What should we call this project?");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("guided-discuss-project.md");
    await expect(window.getByTestId("workflow-preferences-card")).toContainText("Workflow preferences");
    await window.getByTestId("apply-workflow-preferences-button").click();
    await expect(window.getByTestId("workflow-preferences-card")).toContainText("Workflow preferences saved");
    await expect(window.getByTestId("phase-model-select-discuss")).toHaveValue("");
    await expect(window.getByTestId("phase-model-select-execute")).toBeVisible();
    await window.getByTestId("phase-model-select-execute").selectOption("openai:gpt-4o");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find((entry) => entry.selectedPlan?.name === "Launch plan")
        ?.selectedPlan;
      return plan?.workflowPreferences?.models.phaseOverrides?.execute?.modelId ?? "";
    }).toBe("gpt-4o");
    const preferencesProjection = await readFile(join(workspacePath, ".gsd", "PREFERENCES.md"), "utf8");
    expect(preferencesProjection).toContain("commit_policy: per-task");
    expect(preferencesProjection).toContain("branch_model: single");
    expect(preferencesProjection).toContain("workflow_prefs_captured: true");
    expect(preferencesProjection).toContain("phase_overrides:");
    expect(preferencesProjection).toContain("execute:");
    expect(preferencesProjection).toContain("model: gpt-4o");
    const researchDecision = JSON.parse(
      await readFile(join(workspacePath, ".gsd", "runtime", "research-decision.json"), "utf8"),
    ) as { decision: string; source: string };
    expect(researchDecision.decision).toBe("skip");
    expect(researchDecision.source).toBe("workflow-preferences");
    await expect(window.getByTestId("plan-question-prompt")).toHaveText("What should we call this project?");
    await window.getByTestId("plan-answer-textarea").fill("not sure");
    await expect(window.getByTestId("adaptive-follow-up")).toContainText("Suggested follow-up");
    await expect(window.getByTestId("adaptive-follow-up-severity")).toHaveText("High signal");
    await expect(window.getByTestId("adaptive-follow-up-signals")).toContainText("uncertainty");
    await expect(window.getByTestId("adaptive-follow-up-signals")).toContainText("working name");
    await expect(window.getByTestId("adaptive-follow-up-question")).toHaveText(
      "What name would you recognize in a file, branch, or task list next week?",
    );
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find((entry) => entry.selectedPlan?.name === "Launch plan")
        ?.selectedPlan;
      return plan?.answers.some((answer) => answer.answer.includes("What name would you recognize")) ?? false;
    }).toBe(false);
    await window.getByTestId("plan-answer-textarea").fill("");
    await expect(window.getByTestId("adaptive-follow-up")).toHaveCount(0);
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

    for (const [prompt, answer] of discussAnswers) {
      await expect(window.getByTestId("plan-question-prompt")).toHaveText(prompt);
      await window.getByTestId("plan-answer-textarea").fill(answer);
      await window.getByRole("button", { name: "Save answer" }).click();

      if (prompt === projectDepthGatePrompt) {
        await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
        await window.getByRole("button", { name: "Confirm Project" }).click();
        await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("REQUIREMENTS");
        await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("guided-discuss-requirements.md");
      } else if (prompt === requirementsDepthGatePrompt) {
        await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
        await expect(window.getByTestId("requirements-contract")).toContainText("Drafted from requirements answers");
        await expect(window.getByTestId("requirements-contract")).toContainText("R001: First useful version capabilities");
        await expect(window.getByTestId("requirements-contract")).toContainText("Quality bar");
        await window.getByTestId("save-requirements-contract-button").click();
        await expect(window.getByTestId("requirements-contract")).toContainText("Requirements contract saved");
        await expect(window.getByTestId("requirement-row")).toHaveCount(4);
        await expect.poll(async () => {
          const state = await getDesktopState(window);
          const plan = Object.values(state.planningByWorkspace).find((entry) => entry.selectedPlan?.name === "Launch plan")
            ?.selectedPlan;
          return plan?.requirements.some(
            (requirement) =>
              requirement.id === "R001" &&
              requirement.class === "functional" &&
              requirement.status === "active" &&
              requirement.owner === "M1/none yet" &&
              requirement.validationStatus === "unvalidated",
          );
        }).toBe(true);
        await window.getByRole("button", { name: "Confirm Requirements" }).click();
        await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("QUESTIONING / milestone");
        await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("guided-discuss-milestone.md");
      }
    }

    await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
    await window.getByRole("button", { name: "Confirm Milestone" }).click();
    await expect(window.getByTestId("plan-discuss-complete")).toBeVisible();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("RESEARCH DECISION");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("guided-research-decision.md");
    await window.getByRole("button", { name: "Start research" }).click();
    await expect(window.getByTestId("plan-research-panel")).toBeVisible();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("RESEARCH");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("guided-research-project.md");
    await expect(window.getByTestId("research-content-textarea")).toContainText("Research checks:");
    await window.getByTestId("research-title-input").fill("Codebase and workflow research");
    await window
      .getByTestId("research-content-textarea")
      .fill("Findings: Planning state lives in the GSD database, and research output must be accepted before PLAN.");
    await window.getByRole("button", { name: "Stage research" }).click();
    await expect(window.getByTestId("research-output-proposed")).toContainText("Codebase and workflow research");
    await window.getByRole("button", { name: "Accept" }).click();
    await expect(window.getByTestId("plan-ready-card")).toBeVisible();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("PLAN");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("plan-milestone.md / plan-slice.md");
    await window.getByTestId("plan-ready-card").getByRole("button", { name: "Start plan" }).click();
    await expect(window.getByTestId("plan-proposal-panel")).toBeVisible();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("PLAN");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("plan-milestone.md / plan-slice.md");
    const phaseRows = window.getByTestId("plan-phase-row");
    await expect(phaseRows).toHaveCount(1);
    await expect(phaseRows.first().getByTestId("delete-plan-phase-button")).toBeDisabled();
    await phaseRows.first().getByTestId("plan-phase-title-input").fill("Build foundation");
    await phaseRows.first().getByTestId("plan-phase-goal-textarea").fill("Establish the database-backed planning loop.");
    await window.getByTestId("add-plan-phase-button").click();
    await expect(phaseRows).toHaveCount(2);
    await phaseRows.nth(1).getByTestId("plan-phase-title-input").fill("Hardening");
    await phaseRows.nth(1).getByTestId("plan-phase-goal-textarea").fill("Stabilize projections and lifecycle gates.");
    await window.getByTestId("plan-milestone-phase-select").selectOption("P2");
    await phaseRows.first().getByTestId("delete-plan-phase-button").click();
    await expect(phaseRows).toHaveCount(1);
    await expect(window.getByTestId("plan-milestone-phase-select")).toHaveValue("P2");
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
    await access(join(workspacePath, ".gsd", "REQUIREMENTS.md"));
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
    await expect(nameMemory.getByTestId("plan-memory-question")).toHaveText("What should we call this project?");
    await nameMemory.getByRole("button", { name: "Edit" }).click();
    await window.getByTestId("plan-revision-textarea").fill("Launch Control Revised");
    await nameMemory.getByRole("button", { name: "Save revision" }).click();
    await expect(nameMemory).toContainText("Launch Control Revised");
    await expect(nameMemory.getByTestId("plan-memory-question")).toHaveText("What should we call this project?");
    await window.getByTestId("regenerate-projections-button").click();
    await expect(window.getByTestId("projection-summary")).toContainText("written");

    const projectProjection = await readFile(join(workspacePath, ".gsd", "PROJECT.md"), "utf8");
    expect(projectProjection).toContain("pi-gui-plan-builder-generated");
    expect(projectProjection).toContain("# Project: Launch Control Revised");
    expect(projectProjection).toContain("**Complexity:** complex");
    expect(projectProjection).toContain(
      "**Why:** complex - database-backed planning, projections, and execution lifecycle state.",
    );
    const requirementsProjection = await readFile(join(workspacePath, ".gsd", "REQUIREMENTS.md"), "utf8");
    expect(requirementsProjection).toContain("### R001: First useful version capabilities");
    expect(requirementsProjection).toContain("Create a plan, ask focused questions, save answers, and resume after restart.");
    expect(requirementsProjection).toContain("### R002: Quality bar");
    expect(requirementsProjection).toContain("| R001 | M1/none yet | user | unvalidated |");
    expect(requirementsProjection).toContain("Active: 4");
    const roadmapProjection = await readFile(join(workspacePath, ".gsd", "milestones", "M1", "M1-ROADMAP.md"), "utf8");
    expect(roadmapProjection).toContain("Plan Builder vertical slice");
    expect(roadmapProjection).toContain("**Phase:** P2 - Hardening");
    expect(projectProjection).toContain("## Phase Sequence");
    expect(projectProjection).toContain("P2: Hardening");
    const milestoneContextProjection = await readFile(join(workspacePath, ".gsd", "milestones", "M1", "M1-CONTEXT.md"), "utf8");
    expect(milestoneContextProjection).toContain("P2: Hardening");
    expect(milestoneContextProjection).toContain("Stabilize projections and lifecycle gates.");
    const sliceProjection = await readFile(join(workspacePath, ".gsd", "milestones", "M1", "slices", "S1", "S1-PLAN.md"), "utf8");
    expect(sliceProjection).not.toContain("Review integration impact");
    const primaryTaskProjection = await readFile(join(workspacePath, ".gsd", "milestones", "M1", "slices", "S1", "tasks", "T1-PLAN.md"), "utf8");
    expect(primaryTaskProjection).toContain("No lost answers, projection state, and change-control persistence are verified.");
    await window.getByTestId("start-execution-button").click();
    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("EXECUTE");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("execute-task.md");
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
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("VERIFY");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("run-uat.md");
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
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("SHIP");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("complete-slice.md / complete-milestone.md");
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
    await expect(window.getByTestId("phase-model-select-execute")).toHaveValue("openai:gpt-4o");
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("SHIP");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("complete-slice.md / complete-milestone.md");
    await expect(window.getByTestId("plan-ship-panel")).toBeVisible();
    await expect(window.getByTestId("requirements-contract")).toContainText("Requirements contract saved");
    await expect(window.getByTestId("requirements-contract")).toContainText("R001: First useful version capabilities");
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
    await expect(
      window
        .getByTestId("plan-answer-history")
        .locator(".plan-memory__item")
        .filter({ hasText: "Name" })
        .getByTestId("plan-memory-question"),
    ).toHaveText("What should we call this project?");
    const persistedProjectProjection = await readFile(join(workspacePath, ".gsd", "PROJECT.md"), "utf8");
    expect(persistedProjectProjection).toContain("# Project: Launch Control Revised");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      return (
        state.globalPlanningPreferences.phaseModels.discuss?.modelId === "gpt-5" &&
        state.globalPlanningPreferences.phaseModels.research?.modelId === "gpt-4o" &&
        Object.values(state.planningByWorkspace).some(
          (entry) =>
            entry.selectedPlan?.name === "Launch plan" &&
            entry.selectedPlan.activePhase === "ship" &&
            entry.selectedPlan.workflowPreferences?.commitPolicy === "per-task" &&
            entry.selectedPlan.workflowPreferences?.branchModel === "single" &&
            entry.selectedPlan.workflowPreferences?.models.executorClass === "balanced" &&
            entry.selectedPlan.workflowPreferences?.models.phaseOverrides?.execute?.modelId === "gpt-4o" &&
            entry.selectedPlan.requirements.some(
              (requirement) =>
                requirement.id === "R001" &&
                requirement.description ===
                  "Create a plan, ask focused questions, save answers, and resume after restart.",
            ) &&
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
              output.title === "Plan proposal" &&
              output.content.includes("\"phases\"") &&
              output.content.includes("Hardening"),
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
        )
      );
    }).toBe(true);
  } finally {
    await harness.close();
  }
});
