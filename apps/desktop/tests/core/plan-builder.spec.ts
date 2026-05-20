import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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

async function expectActivePromptOnlyInComposer(window: Page, prompt: string): Promise<void> {
  await expect(window.getByTestId("plan-composer-question")).toHaveText(prompt);
  await expect(window.getByText(prompt, { exact: true })).toHaveCount(1);
  await expect(window.getByTestId("workflow-guidance-next-action")).not.toContainText(prompt);
  await expect(window.getByTestId("plan-question-card")).toHaveCount(0);
}

function planDashboardRowByTitle(window: Page, title: string): Locator {
  return window.getByTestId("plan-dashboard-row").filter({
    has: window.locator(".plan-dashboard__row-title").filter({ hasText: title }),
  });
}

async function expectPhaseStripTextNotClipped(window: Page): Promise<void> {
  const phaseStripMetrics = await window.locator(".plan-phase-strip").evaluate((strip) => {
    const stripRect = strip.getBoundingClientRect();
    const clippedText: string[] = [];
    const textNodes = strip.querySelectorAll<HTMLElement>(
      ".plan-phase__index, .plan-phase__label, .plan-phase__status",
    );

    for (const node of textNodes) {
      const rect = node.getBoundingClientRect();
      const verticallyClipped = rect.top < stripRect.top - 1 || rect.bottom > stripRect.bottom + 1;
      const internallyClipped = node.scrollHeight > node.clientHeight + 1;
      if (verticallyClipped || internallyClipped) {
        clippedText.push(node.textContent?.trim() ?? node.className);
      }
    }

    return {
      clippedText,
      stripHeight: stripRect.height,
    };
  });

  expect(phaseStripMetrics.stripHeight).toBeGreaterThanOrEqual(50);
  expect(phaseStripMetrics.clippedText).toEqual([]);
}

async function completeDiscussFromComposer(window: Page): Promise<void> {
  for (const [prompt, answer] of discussAnswers) {
    await expect(window.getByTestId("plan-composer-prompt")).toHaveText(prompt);
    await window.getByTestId("plan-composer-textarea").fill(answer);
    await window.getByLabel("Save Answer").click();

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

async function createAcceptedPlanFromComposer(window: Page, planName: string): Promise<void> {
  await window.getByRole("button", { name: "Plans", exact: true }).click();
  await window.getByTestId("plan-name-input").fill(planName);
  await window.getByRole("button", { name: "Create Plan" }).click();
  await completeDiscussFromComposer(window);
  await window.getByTestId("plan-discuss-complete").getByRole("button", { name: "Start Research" }).click();
  await window.getByTestId("research-title-input").fill(`${planName} research`);
  await window.getByTestId("research-content-textarea").fill("Research accepted before composer completion handoff.");
  await window.getByRole("button", { name: "Stage Research" }).click();
  await window.getByTestId("research-output-proposed").getByRole("button", { name: "Accept" }).click();
  await window.getByTestId("plan-ready-card").getByRole("button", { name: "Start Plan" }).click();
  await expect(window.getByTestId("plan-validation-errors").first()).toContainText("Validation passed");
  await window.getByRole("button", { name: "Stage Plan" }).click();
  await window
    .getByTestId("plan-output-proposed")
    .locator(".plan-research-output")
    .filter({ hasText: "Proposed" })
    .getByRole("button", { name: "Accept plan" })
    .click();
  await expect(window.getByTestId("plan-output-accepted")).toContainText("Plan proposal");
}

async function createAcceptedDependencyPlanViaIpc(window: Page, planName: string): Promise<void> {
  await window.evaluate(async (name) => {
    const app = window.piApp;
    if (!app) {
      throw new Error("piApp IPC bridge is unavailable");
    }
    const readPlan = (state: Awaited<ReturnType<typeof app.getState>>) => {
      const planningState = state.planningByWorkspace[workspaceId] ?? state.planningByWorkspace[state.selectedWorkspaceId];
      const plan = planningState?.selectedPlan;
      if (!plan) {
        throw new Error(`Expected selected plan${state.lastError ? `: ${state.lastError}` : ""}`);
      }
      return plan;
    };

    let state = await app.getState();
    const workspaceId = state.selectedWorkspaceId;
    state = await app.createPlanningPlan({ workspaceId, name });

    for (const stage of ["project", "requirements", "milestone"] as const) {
      const plan = readPlan(state);
      state = await app.confirmPlanningStage({
        workspaceId,
        planId: plan.id,
        expectedRevision: plan.revision,
        stage,
      });
    }

    let plan = readPlan(state);
    state = await app.startPlanningResearch({ workspaceId, planId: plan.id, expectedRevision: plan.revision });
    plan = readPlan(state);
    state = await app.proposePlanningResearch({
      workspaceId,
      planId: plan.id,
      expectedRevision: plan.revision,
      title: `${name} research`,
      content: "Dependency ordering should drive the next work queue.",
    });
    plan = readPlan(state);
    const researchOutput = plan.generatedOutputs.find(
      (output) => output.stage === "research" && output.status === "proposed",
    );
    if (!researchOutput) {
      throw new Error("Expected proposed research output");
    }
    state = await app.reviewPlanningResearch({
      workspaceId,
      planId: plan.id,
      expectedRevision: plan.revision,
      outputId: researchOutput.id,
      status: "accepted",
    });

    plan = readPlan(state);
    state = await app.startPlanningPlan({ workspaceId, planId: plan.id, expectedRevision: plan.revision });
    plan = readPlan(state);
    state = await app.proposePlanningPlan({
      workspaceId,
      planId: plan.id,
      expectedRevision: plan.revision,
      proposal: {
        version: 1,
        boundaryMap: "Use dependencies to order next execution work.",
        ideaPool: "No parked work.",
        phases: [{ id: "P1", title: "Dependency pass", goal: "Show unblocked work first." }],
        milestones: [
          {
            id: "M1",
            title: "Next work milestone",
            phase: "P1",
            outcome: "Execution queue exposes ready and blocked tasks.",
            slices: [
              {
                id: "S1",
                title: "Next work slice",
                goal: "Compute ready and blocked task order.",
                boundary: "Plan Builder next work panel.",
                tasks: [
                  {
                    id: "T1",
                    title: "Build foundation",
                    acceptance: "Foundation evidence exists.",
                    dependencies: [],
                    requirementIds: [],
                  },
                  {
                    id: "T2",
                    title: "Use foundation",
                    acceptance: "Dependent task can start after T1.",
                    dependencies: ["T1"],
                    requirementIds: [],
                  },
                  {
                    id: "T3",
                    title: "Independent check",
                    acceptance: "Independent task is available immediately.",
                    dependencies: [],
                    requirementIds: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    plan = readPlan(state);
    const planOutput = plan.generatedOutputs.find(
      (output) => output.stage === "roadmap" && output.status === "proposed",
    );
    if (!planOutput) {
      throw new Error("Expected proposed plan output");
    }
    state = await app.reviewPlanningPlan({
      workspaceId,
      planId: plan.id,
      expectedRevision: plan.revision,
      outputId: planOutput.id,
      status: "accepted",
    });
    plan = readPlan(state);
    state = await app.startPlanningExecution({ workspaceId, planId: plan.id, expectedRevision: plan.revision });
    await app.setActiveView("plans");
  }, planName);
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

async function reachShipFromComposer(window: Page, planName: string): Promise<void> {
  await createAcceptedPlanFromComposer(window, planName);
  await window.getByTestId("start-execution-button").click();
  await saveDoneExecutionEvidenceForAllTasks(window);
  await window.getByLabel("Start Verify").click();
  await expect(window.getByTestId("plan-verify-panel")).toBeVisible();
  await savePassedVerificationForAllTasks(window);
  await window.getByLabel("Start Ship").click();
  await expect(window.getByTestId("plan-ship-panel")).toBeVisible();
}

test("uses global EXECUTE model when the project has no override", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-global-execute-model");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.evaluate(async () => {
      const app = window.piApp;
      if (!app) {
        throw new Error("piApp IPC bridge is unavailable");
      }
      await app.setGlobalPlanningPhaseModels({
        phaseModels: {
          execute: { providerId: "openai", modelId: "gpt-5" },
        },
      });
    });

    await createAcceptedPlanFromComposer(window, "Global fallback plan");
    await window.getByTestId("start-execution-button").click();
    const routing = window.getByTestId("phase-model-routing-summary");
    await expect(routing).toContainText("All phases have a resolved model");
    await expect(routing.getByTestId("phase-model-routing-row").filter({ hasText: "DISCUSS" })).toContainText(
      "thread default",
    );
    const executeRoute = routing.getByTestId("phase-model-routing-row").filter({ hasText: "EXECUTE" });
    await expect(executeRoute).toContainText("openai/gpt-5");
    await expect(executeRoute).toContainText("global default");
    await expect(window.getByTestId("handoff-bundle-text")).toHaveValue(/EXECUTE: global default - openai\/gpt-5/);
    const task = window.getByTestId("execution-task").filter({ hasText: "Implement and verify the slice" });
    await task.getByTestId("link-task-session-button").click();
    await expect(task.getByTestId("execution-task-link")).toContainText("Execution model: global default (openai/gpt-5)");

    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find((entry) => entry.selectedPlan?.name === "Global fallback plan")
        ?.selectedPlan;
      return plan?.taskSessionLinks.find((link) => link.taskId === "T1")?.executionModel;
    }).toEqual({
      source: "global-default",
      providerId: "openai",
      modelId: "gpt-5",
    });
  } finally {
    await harness.close();
  }
});

test("creates a blank plan without starter template output", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-blank-template");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(window.getByTestId("plan-template-select")).toHaveValue("blank");
    await expect(window.getByTestId("gsd-source-proof")).toContainText("The plan stays grounded in source");
    await expect(window.getByTestId("gsd-source-proof")).toContainText(".gsd/NEXT.md");
    await window.getByTestId("plan-name-input").fill("Blank starter plan");
    await window.getByRole("button", { name: "Create Plan" }).click();

    await expect(window.getByTestId("plan-composer-prompt")).toHaveText("What should we call this project?");
    await expect(window.getByTestId("gsd-operations-inspector")).toContainText(".gsd/gsd.db");
    await expect(window.getByTestId("gsd-operations-inspector")).toContainText("VERIFY -> SHIP");
    await expect(window.getByTestId("plan-template-seed")).toHaveCount(0);
    await expect(window.getByTestId("plan-answer-history")).toHaveCount(0);
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Blank starter plan",
      )?.selectedPlan;
      return {
        answerCount: plan?.answers.length ?? -1,
        starterOutputCount:
          plan?.generatedOutputs.filter((output) => output.title.startsWith("Starter template - ")).length ?? -1,
      };
    }).toEqual({
      answerCount: 0,
      starterOutputCount: 0,
    });
  } finally {
    await harness.close();
  }
});

test("creates a plan from a starter template with editable seeded answers", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-starter-template");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Template starter plan");
    await window.getByTestId("plan-template-select").selectOption("web-app");
    await expect(window.getByTestId("plan-template-summary")).toContainText("Web app");
    await window.getByRole("button", { name: "Create Plan" }).click();

    await expect(window.getByTestId("plan-template-seed")).toContainText("Web app");
    await expect(window.getByTestId("plan-composer-prompt")).toHaveText("What should we call this project?");
    await expect(window.getByTestId("plan-answer-history")).toContainText("UI, persistence, verification");
    await expect(window.getByTestId("plan-answer-history")).toContainText(
      "DISCUSS, RESEARCH, PLAN, EXECUTE, VERIFY, SHIP.",
    );

    const shapeAnswer = window.getByTestId("plan-answer-history").locator(".plan-memory__item").filter({
      has: window.locator(".plan-memory__item-header span").filter({ hasText: /^Shape$/ }),
    });
    await shapeAnswer.getByRole("button", { name: "Edit" }).click();
    await expect(shapeAnswer.getByTestId("plan-revision-textarea")).toHaveValue(
      "complex - UI, persistence, verification, and shipping concerns need explicit planning.",
    );
    await shapeAnswer.getByTestId("plan-revision-textarea").fill("simple - starter narrowed for first release.");
    await shapeAnswer.getByRole("button", { name: "Save Revision" }).click();
    await expect(shapeAnswer).toContainText("simple - starter narrowed for first release.");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Template starter plan",
      )?.selectedPlan;
      return {
        hasTemplateOutput: Boolean(
          plan?.generatedOutputs.some(
            (output) =>
              output.stage === "project" &&
              output.status === "draft" &&
              output.title === "Starter template - Web app" &&
              output.content.includes("\"templateId\": \"web-app\""),
          ),
        ),
        revisedShape:
          [...(plan?.answers ?? [])].reverse().find((answer) => answer.questionId === "project_shape")?.answer ?? "",
      };
    }).toEqual({
      hasTemplateOutput: true,
      revisedShape: "simple - starter narrowed for first release.",
    });
  } finally {
    await harness.close();
  }
});

test("shows next work ordering and updates after dependency completion", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-next-work-panel");
  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await createAcceptedDependencyPlanViaIpc(window, "Next work plan");
    await window.getByRole("button", { name: "Plans", exact: true }).click();

    const panel = window.getByTestId("next-work-panel");
    const autopilot = window.getByTestId("autopilot-preflight");
    await expect(window.getByTestId("run-policy-summary")).toContainText("captured: no");
    await expect(window.getByTestId("run-policy-summary")).toContainText("stop: tests-fail");
    await expect(window.getByTestId("run-guardrails-summary")).toContainText("Tests fail");
    await expect(window.getByTestId("run-guardrails-summary")).toContainText("Dirty worktree conflict");
    await expect(autopilot).toContainText("Ready to run M1/S1/T1");
    await expect(autopilot).toContainText("Build foundation");
    await expect(autopilot).toContainText("A task thread will be created");
    await expect(autopilot.getByTestId("autopilot-start-button")).toHaveText("Run M1/S1/T1");
    await expect(panel).toContainText("2 ready / 1 blocked");
    await expect(panel.getByTestId("next-work-item").nth(0)).toContainText("M1/S1/T1: Build foundation");
    await expect(panel.getByTestId("next-work-item").nth(1)).toContainText("M1/S1/T3: Independent check");
    await expect(panel.getByTestId("next-work-item").nth(2)).toContainText("M1/S1/T2: Use foundation");
    await expect(panel.getByTestId("next-work-item").nth(2)).toContainText(
      "M1/S1/T1: Dependency is not done with evidence",
    );
    await expect(panel.getByTestId("next-work-item").nth(2).getByRole("button", { name: "Create Thread" })).toBeDisabled();

    await expect(panel.getByTestId("start-next-work-button")).toHaveText("Start M1/S1/T1");
    await autopilot.getByTestId("autopilot-start-button").click();
    await expect.poll(async () => (await getDesktopState(window)).activeView).toBe("threads");
    await expect(window.getByTestId("composer")).toHaveValue(/# Execute M1\/S1\/T1: Build foundation/);
    const linkedSessionId = (await getDesktopState(window)).selectedSessionId;
    expect(linkedSessionId).not.toBe("");

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(panel.getByTestId("next-work-item").nth(0).getByRole("button", { name: "Open Thread" })).toBeVisible();
    await expect(autopilot).toContainText("Existing task thread will open");
    await expect(autopilot.getByTestId("autopilot-start-button")).toHaveText("Open M1/S1/T1");
    await expect(panel.getByTestId("start-next-work-button")).toHaveText("Open M1/S1/T1");
    await autopilot.getByTestId("autopilot-start-button").click();
    await expect.poll(async () => (await getDesktopState(window)).selectedSessionId).toBe(linkedSessionId);
    await window.getByRole("button", { name: "Plans", exact: true }).click();

    const foundationTask = window.getByTestId("execution-task").filter({ hasText: "Build foundation" });
    await foundationTask.getByTestId("task-status-select").selectOption("done");
    await foundationTask.getByTestId("task-note-textarea").fill("Foundation complete.");
    await foundationTask.getByTestId("task-evidence-textarea").fill("T1 evidence recorded.");
    await foundationTask.getByTestId("update-task-execution-button").click();

    const ledgerRow = window.getByTestId("evidence-ledger-row").filter({ hasText: "M1/S1/T1: Build foundation" });
    await expect(ledgerRow).toContainText("Execution: Done");
    await expect(ledgerRow).toContainText("Evidence: 1 evidence item");
    await expect(ledgerRow).toContainText("Source: Task T1 - Build foundation");
    await expect(ledgerRow).toContainText("Verification: Pending");
    await expect(autopilot).toContainText("Ready to run M1/S1/T2");
    await expect(autopilot.getByTestId("autopilot-start-button")).toHaveText("Run M1/S1/T2");
    await expect(autopilot.getByTestId("autopilot-start-button")).toBeEnabled();
    await expect(panel).toContainText("2 ready / 0 blocked");
    await expect(panel.getByTestId("start-next-work-button")).toHaveText("Start M1/S1/T2");
    await expect(panel.getByTestId("next-work-item").nth(0)).toContainText("M1/S1/T2: Use foundation");
    await expect(panel.getByTestId("next-work-item").nth(1)).toContainText("M1/S1/T3: Independent check");
  } finally {
    await harness.close();
  }

  harness = await launchDesktop(userDataDir, { testMode: "background" });
  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await window.getByRole("button", { name: "Plans", exact: true }).click();
    const panel = window.getByTestId("next-work-panel");
    await expect(panel).toContainText("2 ready / 0 blocked");
    await expect(panel.getByTestId("start-next-work-button")).toHaveText("Start M1/S1/T2");
    await expect(panel.getByTestId("next-work-item").nth(0)).toContainText("M1/S1/T2: Use foundation");
    await expect(panel.getByTestId("next-work-item").nth(1)).toContainText("M1/S1/T3: Independent check");
    const ledgerRow = window.getByTestId("evidence-ledger-row").filter({ hasText: "M1/S1/T1: Build foundation" });
    await expect(ledgerRow).toContainText("Evidence: 1 evidence item");
    await expect(ledgerRow).toContainText("Source: Task T1 - Build foundation");
  } finally {
    await harness.close();
  }
});

test("persists run recovery summary and projects NEXT after partial progress", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-run-recovery");
  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await createAcceptedDependencyPlanViaIpc(window, "Recovery handoff plan");
    await window.getByRole("button", { name: "Plans", exact: true }).click();

    const foundationTask = window.getByTestId("execution-task").filter({ hasText: "Build foundation" });
    await foundationTask.getByTestId("task-status-select").selectOption("blocked");
    await foundationTask.getByTestId("task-note-textarea").fill("Stopped during overnight run.");
    await foundationTask.getByTestId("task-blocker-textarea").fill("Waiting on credentials.");
    await foundationTask.getByTestId("update-task-execution-button").click();

    const recovery = window.getByTestId("run-recovery-summary");
    await expect(recovery).toContainText("Last attempted: M1/S1/T1: Build foundation");
    await expect(recovery).toContainText("Stop reason: Task blocked");
    await expect(recovery).toContainText("Stop detail: Waiting on credentials.");
    await expect(recovery).toContainText("Resume target: M1/S1/T3: Independent check");
    await expect(recovery.getByTestId("resume-recovery-target-button")).toHaveText("Resume M1/S1/T3");
    const guardrails = window.getByTestId("guardrail-warning-list");
    const autopilot = window.getByTestId("autopilot-preflight");
    await expect(guardrails.getByTestId("guardrail-warning")).toHaveCount(2);
    await expect(guardrails).toContainText("1 blocking / 1 informational");
    await expect(guardrails).toContainText("Projection drift was detected");
    await expect(guardrails).toContainText("Informational · scope-ambiguous");
    await expect(guardrails.getByTestId("guardrail-regenerate-projections-button")).toHaveText(
      "Repair Saved Files",
    );
    await expect(guardrails).toContainText("Previous run stopped before clean completion");
    await expect(guardrails).toContainText("Waiting on credentials.");
    await expect(guardrails).toContainText("Blocking · scope-ambiguous");
    await expect(guardrails.getByTestId("guardrail-resume-button")).toHaveText("Resume M1/S1/T3");
    await expect(autopilot).toContainText("1 blocking guardrail");
    await expect(autopilot.getByTestId("autopilot-blocking-warnings")).toContainText(
      "Previous run stopped before clean completion",
    );
    await expect(autopilot.getByTestId("autopilot-start-button")).toHaveText("Run blocked");
    await expect(autopilot.getByTestId("autopilot-start-button")).toBeDisabled();
    await guardrails.getByTestId("guardrail-regenerate-projections-button").click();
    await expect(guardrails.getByTestId("guardrail-warning")).toHaveCount(1);
    await expect(guardrails).not.toContainText("Projection drift was detected");
    const activity = window.getByTestId("run-activity-ledger");
    await expect(activity.getByTestId("run-activity-entry")).toHaveCount(1);
    await expect(activity).toContainText("Stop updated");
    await expect(activity).toContainText("M1/S1/T1: Build foundation");
    await expect(activity).toContainText("Waiting on credentials.");
    await expect(window.getByTestId("copy-handoff-button")).toHaveText("Copy Handoff");
    const handoffText = await window.getByTestId("handoff-bundle-text").inputValue();
    expect(handoffText).toContain("# Handoff Bundle");
    expect(handoffText).toContain("Recovery handoff plan");
    expect(handoffText).toContain("Projection status:");
    expect(handoffText).toContain("- .gsd/NEXT.md");
    expect(handoffText).toContain("- .gsd/milestones/M1/M1-ROADMAP.md");
    expect(handoffText).toContain("Queue: 1 ready / 2 blocked");
    expect(handoffText).toContain("- Ready: M1/S1/T3 - Independent check");
    expect(handoffText).toContain("- Blocked: M1/S1/T1 - Build foundation - Waiting on credentials.");
    expect(handoffText).toContain(
      "- Blocked: M1/S1/T2 - Use foundation - M1/S1/T1: Dependency is not done with evidence",
    );
    expect(handoffText).toContain("Last attempted: M1/S1/T1: Build foundation");
    expect(handoffText).toContain("Resume: M1/S1/T3: Independent check");
    expect(handoffText).toContain(
      "Stop conditions: tests-fail, scope-ambiguous, destructive-action, dirty-conflict, milestone-complete",
    );
    expect(handoffText).toContain("Task evidence: 0 items");
    expect(handoffText).toContain("Stop updated: M1/S1/T1: Build foundation");
    await expect(window.getByTestId("copy-overnight-report-button")).toHaveText("Copy Report");
    const overnightReportText = await window.getByTestId("overnight-run-report-text").inputValue();
    expect(overnightReportText).toContain("# Overnight Run Report");
    expect(overnightReportText).toContain("Recovery handoff plan");
    expect(overnightReportText).toContain("Tasks: 0 done / 0 in progress / 1 blocked / 2 not started");
    expect(overnightReportText).toContain("Guardrail: Previous run stopped before clean completion");
    expect(overnightReportText).toContain(
      "- M1/S1/T1: Build foundation - Blocked; evidence 0; verification Pending; blocker: Waiting on credentials.",
    );
    expect(overnightReportText).toContain("Next Recommended Action");
    expect(overnightReportText).toContain("Resume M1/S1/T3: Independent check.");

    const nextProjection = await readFile(join(workspacePath, ".gsd", "NEXT.md"), "utf8");
    expect(nextProjection).toContain("## Recovery Summary");
    expect(nextProjection).toContain("Last attempted task: M1/S1/T1: Build foundation");
    expect(nextProjection).toContain("Stop reason: Task blocked");
    expect(nextProjection).toContain("Resume target: M1/S1/T3: Independent check");
    expect(nextProjection).toContain("## Run Activity");
    expect(nextProjection).toContain("Stop updated: M1/S1/T1: Build foundation");
    expect(nextProjection).toContain("Waiting on credentials.");

    await writeFile(join(workspacePath, ".gsd", "NEXT.md"), "# Hand-written next work\n", "utf8");
    await window
      .getByTestId("execution-projection-summary")
      .getByRole("button", { name: "Refresh Saved Files" })
      .click();
    await expect(guardrails.getByTestId("guardrail-warning")).toHaveCount(2);
    await expect(guardrails).toContainText("2 blocking / 0 informational");
    await expect(guardrails).toContainText("Projection write is blocked");
    await expect(guardrails).toContainText(".gsd/NEXT.md");
    await expect(guardrails).toContainText("dirty-conflict");
    await expect(window.getByTestId("execution-overwrite-legacy-projections-button")).toHaveText(
      "Replace Imported Files",
    );
    await expect(guardrails.getByTestId("guardrail-overwrite-projections-button")).toHaveText(
      "Replace Imported Files",
    );
    await expect(autopilot).toContainText("2 blocking guardrails");
    await guardrails.getByTestId("guardrail-overwrite-projections-button").click();
    await expect(guardrails.getByTestId("guardrail-warning")).toHaveCount(1);
    await expect(guardrails).not.toContainText("Projection write is blocked");
  } finally {
    await harness.close();
  }

  harness = await launchDesktop(userDataDir, { testMode: "background" });
  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await window.getByRole("button", { name: "Plans", exact: true }).click();
    const recovery = window.getByTestId("run-recovery-summary");
    await expect(recovery).toContainText("Waiting on credentials.");
    const guardrails = window.getByTestId("guardrail-warning-list");
    await expect(guardrails).toContainText("Previous run stopped before clean completion");
    const activity = window.getByTestId("run-activity-ledger");
    await expect(activity).toContainText("Stop updated");
    await expect(activity).toContainText("M1/S1/T1: Build foundation");
    await expect(window.getByTestId("overnight-run-report-text")).toHaveValue(/Resume M1\/S1\/T3: Independent check\./);
    await expect(recovery.getByTestId("resume-recovery-target-button")).toHaveText("Resume M1/S1/T3");
    await guardrails.getByTestId("guardrail-resume-button").click();
    await expect.poll(async () => (await getDesktopState(window)).activeView).toBe("threads");
    await expect(window.getByTestId("composer")).toHaveValue(/# Execute M1\/S1\/T3: Independent check/);
    const resumedSessionId = (await getDesktopState(window)).selectedSessionId;
    expect(resumedSessionId).not.toBe("");

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(activity.getByTestId("run-activity-entry")).toHaveCount(2);
    await expect(activity).toContainText("Resume attempted");
    await expect(activity).toContainText("M1/S1/T3: Independent check");
    await expect(window.getByTestId("handoff-bundle-text")).toHaveValue(/Resume attempted: M1\/S1\/T3: Independent check/);
    await expect(recovery.getByTestId("resume-recovery-target-button")).toHaveText("Open M1/S1/T3");
    await recovery.getByTestId("resume-recovery-target-button").click();
    await expect.poll(async () => (await getDesktopState(window)).selectedSessionId).toBe(resumedSessionId);
    const resumedProjection = await readFile(join(workspacePath, ".gsd", "NEXT.md"), "utf8");
    expect(resumedProjection).toContain("Resume attempted: M1/S1/T3: Independent check");
  } finally {
    await harness.close();
  }
});

test("shows a cross-plan dashboard and switches selected plans", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-dashboard");
  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await createAcceptedDependencyPlanViaIpc(window, "Ready dashboard plan");
    await createAcceptedDependencyPlanViaIpc(window, "Risk dashboard plan");
    await window.evaluate(async () => {
      const app = window.piApp;
      if (!app) {
        throw new Error("piApp IPC bridge is unavailable");
      }
      const state = await app.getState();
      const workspaceId = state.selectedWorkspaceId;
      const plan = state.planningByWorkspace[workspaceId]?.selectedPlan;
      if (!plan) {
        throw new Error("Expected risk dashboard plan");
      }
      await app.updatePlanningTaskExecution({
        workspaceId,
        planId: plan.id,
        expectedRevision: plan.revision,
        taskId: "T1",
        taskPath: "M1/S1/T1",
        status: "blocked",
        note: "Blocked during health check.",
        blocker: "Waiting on access.",
        evidence: "",
      });
    });
    await writeFile(
      join(workspacePath, ".gsd", "NEXT.md"),
      "<!-- pi-gui-plan-builder-generated\nsource: .gsd/gsd.db\n-->\n\n# Stale dashboard projection\n",
      "utf8",
    );
    await window.evaluate(async () => {
      const app = window.piApp;
      if (!app) {
        throw new Error("piApp IPC bridge is unavailable");
      }
      const state = await app.getState();
      await app.createPlanningPlan({ workspaceId: state.selectedWorkspaceId, name: "Draft dashboard plan" });
      await app.setActiveView("plans");
    });

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    const readyRow = window.getByTestId("plan-dashboard-row").nth(0);
    const riskRow = window.getByTestId("plan-dashboard-row").nth(1);
    const draftRow = window.getByTestId("plan-dashboard-row").nth(2);
    await expect(readyRow).toContainText("Ready dashboard plan");
    await expect(riskRow).toContainText("Risk dashboard plan");
    await expect(draftRow).toContainText("Draft dashboard plan");
    await expect(readyRow).toContainText("EXECUTE");
    await expect(readyRow).toContainText("2 ready / 1 blocked");
    await expect(readyRow).toContainText("M1/S1/T1: Build foundation");
    await expect(readyRow.getByTestId("plan-dashboard-conflicts")).toHaveText("Conflicts with Risk dashboard plan");
    await expect(readyRow.getByTestId("plan-dashboard-health")).toContainText("1 plan conflict");
    await expect(riskRow.getByTestId("plan-dashboard-conflicts")).toHaveText("Conflicts with Ready dashboard plan");
    await expect(riskRow).toContainText("1 blocker");
    await expect(riskRow).toContainText("1 recovery stop");
    await expect(riskRow).toContainText("1 evidence gap");
    await expect(riskRow).toContainText("1 projection issue");
    await expect(riskRow).toContainText("1 plan conflict");
    await expect(draftRow).toContainText("DISCUSS");
    await expect(draftRow).toContainText("No accepted plan");
    await expect(draftRow.getByTestId("plan-dashboard-conflicts")).toHaveText("No cross-plan conflicts");
    await expect(draftRow.getByTestId("plan-dashboard-health")).toHaveText("Health: healthy");

    await readyRow.click();
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Ready dashboard plan");
    await draftRow.click();
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Draft dashboard plan");
  } finally {
    await harness.close();
  }
});

test("archives and restores plans across restart", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-archive-restore");
  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await createAcceptedDependencyPlanViaIpc(window, "Keep active plan");
    await createAcceptedDependencyPlanViaIpc(window, "Archive candidate plan");
    await window.getByRole("button", { name: "Plans", exact: true }).click();

    await expect(window.getByTestId("plan-outline-title")).toHaveText("Archive candidate plan");
    await window.getByTestId("ship-plan-button").click();
    await expect(window.getByTestId("plan-status-label")).toHaveText("Shipped");
    await window.getByTestId("archive-plan-button").click();

    await expect(window.getByTestId("plan-outline-title")).toHaveText("Keep active plan");
    await expect(planDashboardRowByTitle(window, "Archive candidate plan")).toHaveCount(0);
    await expect(window.getByTestId("archived-plan-list")).toContainText("Archive candidate plan");
  } finally {
    await harness.close();
  }

  harness = await launchDesktop(userDataDir, { testMode: "background" });
  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(planDashboardRowByTitle(window, "Archive candidate plan")).toHaveCount(0);

    const archivedRow = window.getByTestId("archived-plan-row").filter({ hasText: "Archive candidate plan" });
    await expect(archivedRow).toBeVisible();
    await archivedRow.getByTestId("restore-archived-plan-button").click();

    await expect(window.getByTestId("plan-outline-title")).toHaveText("Archive candidate plan");
    await expect(window.getByTestId("plan-status-label")).toHaveText("Active");
    await expect(planDashboardRowByTitle(window, "Archive candidate plan")).toHaveCount(1);
    await expect(window.getByTestId("archived-plan-row").filter({ hasText: "Archive candidate plan" })).toHaveCount(0);
  } finally {
    await harness.close();
  }
});

test("shows legacy GSD Markdown references and ignores generated projections", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-legacy-reference");
  await mkdir(join(workspacePath, ".gsd", "legacy"), { recursive: true });
  await writeFile(
    join(workspacePath, ".gsd", "legacy", "BLUEPRINT.md"),
    "# Legacy Blueprint\n\nUse prior planning notes as context, not canonical plan state.\n",
    "utf8",
  );
  await writeFile(
    join(workspacePath, ".gsd", "PROJECT.md"),
    "<!-- pi-gui-plan-builder-generated\nsource: .gsd/gsd.db\n-->\n\n# Generated Project\n",
    "utf8",
  );

  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Reference import plan");
    await window.getByRole("button", { name: "Create Plan" }).click();

    const references = window.getByTestId("legacy-reference-list");
    await expect(references).toContainText("Legacy Blueprint");
    await expect(references).toContainText(".gsd/legacy/BLUEPRINT.md");
    await expect(references).toContainText("Use prior planning notes as context, not canonical plan state.");
    await expect(references).not.toContainText("Generated Project");
    await references.getByRole("button", { name: "Park Excerpt" }).click();
    const ideaPool = window.getByTestId("plan-idea-pool");
    await expect(ideaPool).toContainText("Legacy reference: .gsd/legacy/BLUEPRINT.md");
    await expect(ideaPool).toContainText("Use prior planning notes as context, not canonical plan state.");

    const state = await getDesktopState(window);
    const selectedPlan = state.planningByWorkspace[state.selectedWorkspaceId]?.selectedPlan;
    expect(selectedPlan?.legacyReferences).toHaveLength(1);
    expect(selectedPlan?.legacyReferences[0]?.path).toBe(".gsd/legacy/BLUEPRINT.md");
    expect(selectedPlan?.project.title).toBeUndefined();
    const promotedIdea = selectedPlan?.parkedItems.find((item) =>
      item.rationale.includes(".gsd/legacy/BLUEPRINT.md"),
    );
    expect(promotedIdea?.text).toBe("Use prior planning notes as context, not canonical plan state.");
    expect(promotedIdea?.rationale).toContain("Promoted from legacy Markdown reference .gsd/legacy/BLUEPRINT.md");
    await expect(readFile(join(workspacePath, ".gsd", "legacy", "BLUEPRINT.md"), "utf8")).resolves.toContain(
      "Use prior planning notes as context, not canonical plan state.",
    );

    await harness.close();
    harness = await launchDesktop(userDataDir, {
      initialWorkspaces: [workspacePath],
      testMode: "background",
    });
    const reopenedWindow = await harness.firstWindow();
    await waitForWorkspaceByPath(reopenedWindow, workspacePath);
    await reopenedWindow.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(reopenedWindow.getByTestId("legacy-reference-list")).toContainText("Legacy Blueprint");
    await expect(reopenedWindow.getByTestId("plan-idea-pool")).toContainText(
      "Use prior planning notes as context, not canonical plan state.",
    );
  } finally {
    await harness.close();
  }
});

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
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Start");
    await expect(window.getByTestId("workflow-guidance-next-action")).toContainText("Create a plan");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("guided-discuss-project.md");
    await expect(window.locator(".topbar__session")).toHaveText("Plans");
    await expect(window.getByRole("button", { name: "Plans", exact: true })).toHaveClass(/sidebar__nav-item--active/);
    await expect.poll(async () => (await getDesktopState(window)).activeView).toBe("plans");

    await window.getByRole("button", { name: "New Thread", exact: true }).click();
    await expect(window.getByTestId("new-thread-composer")).toBeVisible();
    await window.getByRole("button", { name: "Plans", exact: true }).click();
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
    await harness.electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.setBounds({ width: 1180, height: 520 });
    });
    await window.locator(".plan-phase-strip").scrollIntoViewIfNeeded();
    await expectPhaseStripTextNotClipped(window);
    await window.getByTestId("plan-name-input").fill("Theme plan");
    await window.getByRole("button", { name: "Create Plan" }).click();
    await expect(window.getByTestId("workflow-preferences-card")).toHaveCount(0);
    await expect(window.getByTestId("phase-model-select-execute")).toHaveCount(0);
    await window.getByRole("button", { name: "Project Preferences", exact: true }).click();
    await expect(window.getByTestId("project-preferences-view")).toBeVisible();
    await expect(window.getByTestId("workflow-preferences-card")).toContainText("Project Preferences");
    await window.getByTestId("apply-workflow-preferences-button").click();
    await expect(window.getByTestId("workflow-preferences-status")).toHaveText("Saved");
    await expect(window.getByTestId("phase-model-select-execute")).toBeVisible();
    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await harness.electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.setBounds({ width: 1180, height: 520 });
    });
    await window.locator(".plan-phase-strip").scrollIntoViewIfNeeded();
    await expectPhaseStripTextNotClipped(window);
    const phaseStripBox = await window.locator(".plan-phase-strip").boundingBox();
    expect(phaseStripBox).not.toBeNull();
    await expect(window.getByTestId("workflow-preferences-card")).toHaveCount(0);
    const phaseIndexFontFamily = await window
      .locator(".plan-phase__index")
      .first()
      .evaluate((node) => getComputedStyle(node).fontFamily);
    expect(phaseIndexFontFamily).not.toMatch(/mono/i);
    await window.getByTestId("plan-composer-textarea").fill("Readable action contrast check");

    const planReadableTargets = [
      { name: "plan title", locator: window.getByTestId("plan-builder-title") },
      { name: "answer textarea", locator: window.getByTestId("plan-composer-textarea") },
      { name: "Save Answer button", locator: window.getByLabel("Save Answer") },
      { name: "Park for Later button", locator: window.getByLabel("Park for Later") },
      { name: "prompt source", locator: window.getByTestId("workflow-guidance-prompt-source") },
    ] as const;
    const expectReadableContrast = async (
      theme: "light" | "dark",
      targets: readonly { readonly name: string; readonly locator: ReturnType<typeof window.getByTestId> }[],
    ) => {
      await window.evaluate((nextTheme) => {
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
      }, theme);
      for (const target of targets) {
        await expect
          .poll(() => contrastRatioFor(target.locator), { message: `${target.name} contrast in ${theme} theme` })
          .toBeGreaterThanOrEqual(4.5);
      }
    };

    await expectReadableContrast("light", planReadableTargets);
    await expectReadableContrast("dark", planReadableTargets);

    await window.getByRole("button", { name: "Project Preferences", exact: true }).click();
    await expect(window.getByTestId("project-preferences-view")).toBeVisible();
    await expect(window.getByTestId("phase-model-select-execute")).toBeVisible();
    await expect(window.getByTestId("workflow-preferences-summary")).toContainText("supervised runs");
    await expect(window.getByTestId("workflow-preferences-status")).toHaveText("Saved");

    const preferencesReadableTargets = [
      { name: "phase model select", locator: window.getByTestId("phase-model-select-execute") },
      { name: "workflow preference summary", locator: window.getByTestId("workflow-preferences-summary") },
    ] as const;
    await expectReadableContrast("light", preferencesReadableTargets);
    await expectReadableContrast("dark", preferencesReadableTargets);
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
    await window.getByRole("button", { name: "Create Plan" }).click();
    await expect(window.getByTestId("plan-composer-prompt")).toHaveText("What should we call this project?");
    await window.getByTestId("plan-composer-textarea").fill("not sure");
    await window.getByLabel("Save Answer").click();

    const nameMemory = window.getByTestId("plan-answer-history").locator(".plan-memory__item").filter({ hasText: "Name" });
    await expect(window.getByTestId("adaptive-guidance-rollup-summary")).toContainText("1 unresolved");
    await expect(nameMemory.getByTestId("plan-memory-question")).toHaveText("What should we call this project?");
    await expect(nameMemory.getByTestId("adaptive-follow-up")).toContainText("Suggested follow-up");
    await expect(nameMemory.getByTestId("adaptive-follow-up-action")).toHaveText("Edit Answer");
    await nameMemory.getByTestId("adaptive-follow-up-action").click();
    await expect(nameMemory.getByTestId("plan-revision-textarea")).toHaveValue("not sure");
    await nameMemory.getByTestId("plan-revision-textarea").fill("Resolved launch plan");
    await nameMemory.getByRole("button", { name: "Save Revision" }).click();

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
    await window.getByRole("button", { name: "Create Plan" }).click();
    await expectActivePromptOnlyInComposer(window, "What should we call this project?");
    await window.getByTestId("plan-composer-textarea").fill("Composer Driven Plan");
    await expect(window.getByTestId("plan-composer-textarea")).toHaveValue("Composer Driven Plan");
    await window.getByLabel("Save Answer").click();

    await expectActivePromptOnlyInComposer(
      window,
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
    await window.getByRole("button", { name: "Create Plan" }).click();
    await expectActivePromptOnlyInComposer(window, "What should we call this project?");
    await expect(window.getByTestId("plan-composer-question-frame")).toBeVisible();
    await expect(window.getByTestId("plan-composer-answer-frame")).toBeVisible();
    await expect(window.getByLabel("Save Answer")).toContainText("Save Answer");
    await expect(window.getByLabel("Park for Later")).toContainText("Park for Later");
    const composerActionLabels = await window
      .getByTestId("plan-composer-actions")
      .locator("button")
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")));
    expect(composerActionLabels).toEqual(["Save Answer", "Park for Later"]);
    await window.getByTestId("plan-composer-textarea").fill("Question Stays Visible");
    await expectActivePromptOnlyInComposer(window, "What should we call this project?");
    await window.getByLabel("Save Answer").click();

    await expectActivePromptOnlyInComposer(
      window,
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
    await window.getByRole("button", { name: "Create Plan" }).click();
    await window.getByTestId("plan-composer-textarea").fill("Focus stays on composer");
    await window.getByLabel("Save Answer").click();

    await expect(window.getByTestId("plan-composer-prompt")).toHaveText(
      "What are we building, and what outcome should it create?",
    );
    await expect(window.getByTestId("plan-composer-textarea")).toBeFocused();
    await window.getByTestId("plan-composer-textarea").fill("Park this composer draft");
    await window.getByRole("button", { name: "Park for Later" }).click();

    await expect(window.getByTestId("plan-composer-prompt")).toHaveText(
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
    await window.getByRole("button", { name: "Create Plan" }).click();
    await window.getByTestId("plan-composer-textarea").fill("Keyboard Shortcut Plan");
    await window.getByTestId("plan-composer-textarea").press("Control+Enter");

    await expect(window.getByTestId("plan-composer-prompt")).toHaveText(
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
    await window.getByRole("button", { name: "Create Plan" }).click();
    await completeDiscussFromComposer(window);
    await expect(window.getByText("The project context is set. Decide whether research is needed before planning.")).toBeVisible();
    await window.getByLabel("Start Research").click();

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
    await window.getByRole("button", { name: "Create Plan" }).click();
    await completeDiscussFromComposer(window);
    await window.getByTestId("plan-discuss-complete").getByRole("button", { name: "Start Research" }).click();
    await expect(window.getByTestId("plan-research-panel")).toBeVisible();
    await window.getByTestId("research-title-input").fill("Composer handoff research");
    await window.getByTestId("research-content-textarea").fill("Research accepted before composer PLAN handoff.");
    await window.getByRole("button", { name: "Stage Research" }).click();
    await window.getByTestId("research-output-proposed").getByRole("button", { name: "Accept" }).click();
    await expect(window.getByTestId("plan-ready-card")).toBeVisible();
    await expect(window.getByText("Use the accepted research to shape the roadmap.")).toBeVisible();
    await window.getByLabel("Create Plan").click();

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
    await window.getByRole("button", { name: "Create Plan" }).click();
    await completeDiscussFromComposer(window);
    await window.getByTestId("plan-discuss-complete").getByRole("button", { name: "Start Research" }).click();
    await window.getByTestId("research-title-input").fill("Composer execute research");
    await window.getByTestId("research-content-textarea").fill("Research accepted before composer EXECUTE handoff.");
    await window.getByRole("button", { name: "Stage Research" }).click();
    await window.getByTestId("research-output-proposed").getByRole("button", { name: "Accept" }).click();
    await window.getByTestId("plan-ready-card").getByRole("button", { name: "Start Plan" }).click();
    await expect(window.getByTestId("plan-validation-errors").first()).toContainText("Validation passed");
    await window.getByRole("button", { name: "Stage Plan" }).click();
    await window
      .getByTestId("plan-output-proposed")
      .locator(".plan-research-output")
      .filter({ hasText: "Proposed" })
      .getByRole("button", { name: "Accept plan" })
      .click();
    await expect(window.getByTestId("plan-output-accepted")).toContainText("Plan proposal");
    await expect(window.getByText("The plan is accepted. Start the task work when you are ready.")).toBeVisible();
    await window.getByLabel("Start Execute").click();

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

test("parks later-phase idea from the Plan Builder composer", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-later-idea");
  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await createAcceptedPlanFromComposer(window, "Composer later idea plan");
    await window.getByTestId("start-execution-button").click();
    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await expect(window.getByTestId("plan-composer-question")).toHaveText("Work through the task queue and save evidence as you go.");
    await window.getByTestId("plan-composer-textarea").fill("Consider a post-ship audit task.");
    await expect(window.getByTestId("plan-composer-question")).toHaveText("Park a planning note or change request");
    await window.getByLabel("Park Note").click();

    await expect(window.getByTestId("plan-composer-textarea")).toHaveValue("");
    const idea = window.getByTestId("plan-idea-item").filter({ hasText: "Consider a post-ship audit task." });
    await expect(idea).toContainText("Composer note captured during EXECUTE");
    await expect(idea.getByTestId("plan-idea-status")).toHaveText("Parked");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer later idea plan",
      )?.selectedPlan;
      return {
        activePhase: plan?.activePhase ?? "",
        answerCount: plan?.answers.length ?? -1,
        parkedText: plan?.parkedItems.at(-1)?.text ?? "",
        parkedSource: plan?.parkedItems.at(-1)?.sourceType ?? "",
      };
    }).toEqual({
      activePhase: "execute",
      answerCount: discussAnswers.length,
      parkedText: "Consider a post-ship audit task.",
      parkedSource: "composer",
    });
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
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Composer later idea plan");
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Execute");
    await expect(window.getByTestId("plan-idea-item").filter({ hasText: "Consider a post-ship audit task." })).toBeVisible();
  } finally {
    await harness.close();
  }
});

test("reviews newly parked later-phase idea from the Plan Builder composer", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-later-idea-review");
  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });
  const ideaText = "Promote retry budget into execution work.";
  const revisedIdeaText = "Promote retry budget with revised acceptance.";

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await createAcceptedPlanFromComposer(window, "Composer later idea review plan");
    await window.getByTestId("start-execution-button").click();
    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await window.getByTestId("plan-composer-textarea").fill(ideaText);
    await window.getByLabel("Park Note").click();

    const review = window.getByTestId("plan-composer-parked-review");
    await expect(review).toContainText(ideaText);
    await expect(review.getByTestId("plan-composer-parked-review-status")).toHaveText("Parked");
    const idea = window.getByTestId("plan-idea-item").filter({ hasText: ideaText });
    await idea.getByRole("button", { name: "Edit idea" }).click();
    const editForm = window.getByTestId("plan-idea-edit-form");
    await expect(editForm).toBeVisible();
    await editForm.getByTestId("plan-idea-text-textarea").fill(revisedIdeaText);
    await editForm.getByRole("button", { name: "Save Idea" }).click();
    const revisedIdea = window.getByTestId("plan-idea-item").filter({ hasText: revisedIdeaText });
    await expect(revisedIdea.getByTestId("plan-idea-status")).toHaveText("Parked");
    await expect(review).toContainText(revisedIdeaText);
    await review.getByRole("button", { name: "Prepare" }).click();
    await expect(review.getByTestId("plan-composer-parked-review-status")).toHaveText("Ready to promote");
    await expect(revisedIdea.getByTestId("plan-idea-status")).toHaveText("Ready to promote");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer later idea review plan",
      )?.selectedPlan;
      const parkedItem = plan?.parkedItems.find((item) => item.text === revisedIdeaText);
      return {
        activePhase: plan?.activePhase ?? "",
        reviewStatus: parkedItem?.reviewStatus ?? "",
        sourcePrompt: parkedItem?.sourcePrompt ?? "",
      };
    }).toEqual({
      activePhase: "execute",
      reviewStatus: "promotion-ready",
      sourcePrompt: "Composer note captured during EXECUTE",
    });
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
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Composer later idea review plan");
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Execute");
    await expect(
      window.getByTestId("plan-idea-item").filter({ hasText: revisedIdeaText }).getByTestId("plan-idea-status"),
    ).toHaveText("Ready to promote");
  } finally {
    await harness.close();
  }
});

test("starts a change draft from a prepared composer idea", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-change-draft");
  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });
  const ideaText = "Add retry budget review before verification.";
  const revisedIdeaText = "Add retry budget review with edited acceptance.";
  const replacementIdeaText = "Add retry budget replacement after draft deletion.";

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await createAcceptedPlanFromComposer(window, "Composer change draft plan");
    await window.getByTestId("start-execution-button").click();
    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await window.getByTestId("plan-composer-textarea").fill(ideaText);
    await window.getByLabel("Park Note").click();

    const review = window.getByTestId("plan-composer-parked-review");
    const originalIdea = window.getByTestId("plan-idea-item").filter({ hasText: ideaText });
    await originalIdea.getByRole("button", { name: "Edit idea" }).click();
    const editForm = window.getByTestId("plan-idea-edit-form");
    await editForm.getByTestId("plan-idea-text-textarea").fill(revisedIdeaText);
    await editForm.getByRole("button", { name: "Save Idea" }).click();
    const idea = window.getByTestId("plan-idea-item").filter({ hasText: revisedIdeaText });
    await expect(review).toContainText(revisedIdeaText);
    await review.getByRole("button", { name: "Prepare" }).click();
    await expect(review.getByRole("button", { name: "Draft Change" })).toBeEnabled();
    await review.getByRole("button", { name: "Draft Change" }).click();

    await expect(idea.getByTestId("plan-change-draft-form")).toBeVisible();
    const titleInput = idea.getByTestId("plan-change-title-input");
    await expect(titleInput).toBeFocused();
    await expect(idea.getByTestId("plan-change-summary-textarea")).toHaveValue(revisedIdeaText);
    await titleInput.fill("Retry budget change");
    await idea.getByRole("button", { name: "Save Draft" }).click();
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Retry budget change");
    await expect(window.getByTestId("plan-change-proposals")).toContainText(revisedIdeaText);
    await expect(idea.getByRole("button", { name: "Review Proposal" })).toBeEnabled();
    await expect(idea.getByRole("button", { name: "Drafted" })).toHaveCount(0);
    await idea.getByRole("button", { name: "Review Proposal" }).click();
    await expect(
      window.getByTestId("plan-change-proposal").filter({ hasText: "Retry budget change" }).getByTestId("plan-injection-target-select"),
    ).toBeFocused();
    await expect(review.getByRole("button", { name: "Review Proposal" })).toBeEnabled();
    await review.getByRole("button", { name: "Review Proposal" }).click();
    await expect(
      window.getByTestId("plan-change-proposal").filter({ hasText: "Retry budget change" }).getByTestId("plan-injection-target-select"),
    ).toBeFocused();
    const firstProposal = window.getByTestId("plan-change-proposal").filter({ hasText: "Retry budget change" });
    await firstProposal.getByRole("button", { name: "Delete draft" }).click();
    await expect(firstProposal.getByTestId("plan-change-proposal-status")).toHaveText("Deleted");
    await idea.getByRole("button", { name: "Edit idea" }).click();
    const replacementEditForm = window.getByTestId("plan-idea-edit-form");
    await replacementEditForm.getByTestId("plan-idea-text-textarea").fill(replacementIdeaText);
    await replacementEditForm.getByRole("button", { name: "Save Idea" }).click();
    const replacementIdea = window.getByTestId("plan-idea-item").filter({ hasText: replacementIdeaText });
    await expect(replacementIdea.getByRole("button", { name: "Draft Change" })).toBeEnabled();
    await replacementIdea.getByRole("button", { name: "Draft Change" }).click();
    await expect(replacementIdea.getByTestId("plan-change-draft-form")).toBeVisible();
    await expect(replacementIdea.getByTestId("plan-change-summary-textarea")).toHaveValue(replacementIdeaText);
    await replacementIdea.getByTestId("plan-change-title-input").fill("Retry budget replacement");
    await replacementIdea.getByRole("button", { name: "Save Draft" }).click();
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Retry budget replacement");
    await expect(window.getByTestId("plan-change-proposals")).toContainText(replacementIdeaText);
    await expect(replacementIdea.getByRole("button", { name: "Review Proposal" })).toBeEnabled();
    const replacementProposal = window.getByTestId("plan-change-proposal").filter({ hasText: "Retry budget replacement" });
    await replacementProposal.getByRole("button", { name: "Edit draft details" }).click();
    await expect(replacementProposal.getByTestId("plan-change-proposal-edit-form")).toBeVisible();
    await replacementProposal.getByTestId("plan-change-proposal-title-input").fill("Retry budget replacement revised");
    await replacementProposal
      .getByTestId("plan-change-proposal-summary-textarea")
      .fill("Revise the retry budget change before approval.");
    await replacementProposal
      .getByTestId("plan-change-proposal-impact-textarea")
      .fill("Impact: revised retry budget boundaries.");
    await replacementProposal.getByRole("button", { name: "Save details" }).click();
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Retry budget replacement revised");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Impact: revised retry budget boundaries.");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer change draft plan",
      )?.selectedPlan;
      return {
        activePhase: plan?.activePhase ?? "",
        replacementDrafted:
          plan?.changeProposals.some(
            (proposal) =>
              proposal.title === "Retry budget replacement revised" &&
              proposal.summary === "Revise the retry budget change before approval." &&
              proposal.impactNotes === "Impact: revised retry budget boundaries." &&
              proposal.status === "draft",
          ) ?? false,
        firstDraftDeleted:
          plan?.changeProposals.some(
            (proposal) => proposal.title === "Retry budget change" && proposal.status === "withdrawn",
          ) ?? false,
      };
    }).toEqual({
      activePhase: "execute",
      replacementDrafted: true,
      firstDraftDeleted: true,
    });
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
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Composer change draft plan");
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Execute");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Retry budget change");
    await expect(
      window
        .getByTestId("plan-change-proposal")
        .filter({ hasText: "Retry budget change" })
        .filter({ hasText: "Deleted" })
        .getByTestId("plan-change-proposal-status"),
    ).toHaveText("Deleted");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Retry budget replacement revised");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Impact: revised retry budget boundaries.");
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

    await createAcceptedPlanFromComposer(window, "Composer verify handoff plan");
    await window.getByTestId("start-execution-button").click();
    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await expect(window.getByText("Work through the task queue and save evidence as you go.")).toBeVisible();
    await expect(window.getByLabel("Start Verify")).toHaveCount(0);

    await saveDoneExecutionEvidenceForAllTasks(window);
    await expect(window.getByText("The task evidence is ready. Move on to verification.")).toBeVisible();
    await window.getByLabel("Start Verify").click();

    await expect(window.getByTestId("plan-verify-panel")).toBeVisible();
    await expect(window.getByTestId("verification-evidence-report")).toBeVisible();
    await expect(window.getByTestId("verification-evidence-report-text")).toHaveValue(
      /# Verification Evidence Report/,
    );
    await expect(window.getByTestId("verification-evidence-report-text")).toHaveValue(
      /Evidence 1 saved from EXECUTE\./,
    );
    await expect(window.getByTestId("verification-evidence-report-text")).toHaveValue(/Verification: Pending/);
    await expect(window.getByTestId("verification-evidence-report-text")).toHaveValue(/Gaps: verification pending/);
    await expect(window.getByTestId("copy-evidence-report-button")).toHaveText("Copy Report");
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

    await createAcceptedPlanFromComposer(window, "Composer ship handoff plan");
    await window.getByTestId("start-execution-button").click();
    await saveDoneExecutionEvidenceForAllTasks(window);
    await window.getByLabel("Start Verify").click();
    await expect(window.getByTestId("plan-verify-panel")).toBeVisible();
    await expect(window.getByText("Check each finished task against its acceptance notes.")).toBeVisible();
    await expect(window.getByLabel("Start Ship")).toHaveCount(0);

    await savePassedVerificationForAllTasks(window);
    await expect(window.getByText("Everything is verified. You can prepare the ship handoff.")).toBeVisible();
    await window.getByLabel("Start Ship").click();

    await expect(window.getByTestId("plan-ship-panel")).toBeVisible();
    await expect(window.getByTestId("overnight-run-report")).toBeVisible();
    await expect(window.getByTestId("overnight-run-report-text")).toHaveValue(/# Overnight Run Report/);
    await expect(window.getByTestId("overnight-run-report-text")).toHaveValue(/Tasks: 1 done /);
    await expect(window.getByTestId("overnight-run-report-text")).toHaveValue(
      /No EXECUTE work remains; continue to VERIFY or SHIP\./,
    );
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

test("records SHIP summary from the Plan Builder composer", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-ship-summary");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await reachShipFromComposer(window, "Composer ship summary plan");
    await expect(window.getByTestId("plan-composer-question")).toHaveText("Final SHIP handoff summary");
    await window.getByTestId("plan-composer-textarea").fill("Composer closeout saved for the next thread.");
    await window.getByLabel("Save Summary").click();

    await expect(window.getByTestId("ship-summary-recorded")).toContainText(
      "Composer closeout saved for the next thread.",
    );
    await expect(window.getByTestId("plan-composer-textarea")).toHaveValue("");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer ship summary plan",
      )?.selectedPlan;
      return plan?.shipSummaries.at(-1)?.summary ?? "";
    }).toBe("Composer closeout saved for the next thread.");
  } finally {
    await harness.close();
  }
});

test("restores keyboard-submitted SHIP summary from the Plan Builder composer", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-ship-summary-restart");
  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await reachShipFromComposer(window, "Composer ship summary restart plan");
    await window.getByTestId("plan-composer-textarea").fill("Keyboard closeout persists after restart.");
    await window.getByTestId("plan-composer-textarea").press("Control+Enter");
    await expect(window.getByTestId("ship-summary-recorded")).toContainText(
      "Keyboard closeout persists after restart.",
    );
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
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Composer ship summary restart plan");
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Ship");
    await expect(window.getByTestId("ship-summary-recorded")).toContainText(
      "Keyboard closeout persists after restart.",
    );
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer ship summary restart plan",
      )?.selectedPlan;
      return {
        activePhase: plan?.activePhase ?? "",
        summary: plan?.shipSummaries.at(-1)?.summary ?? "",
      };
    }).toEqual({
      activePhase: "ship",
      summary: "Keyboard closeout persists after restart.",
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
    await window.getByRole("button", { name: "Create Plan" }).click();
    await expect(window.getByTestId("plan-composer-prompt")).toHaveText("What should we call this project?");
    await window.getByTestId("plan-composer-textarea").fill("Revisit naming after research");
    await expect(window.getByTestId("plan-composer-textarea")).toHaveValue("Revisit naming after research");
    await window.getByRole("button", { name: "Park for Later" }).click();

    await expect(window.getByTestId("plan-composer-prompt")).toHaveText("What should we call this project?");
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

test("restores a dismissed composer draft idea after restart", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("plan-builder-composer-idea-restore");
  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });
  const ideaText = "Revisit naming after research";

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await window.getByTestId("plan-name-input").fill("Composer restore plan");
    await window.getByRole("button", { name: "Create Plan" }).click();
    await expect(window.getByTestId("plan-composer-prompt")).toHaveText("What should we call this project?");
    await window.getByTestId("plan-composer-textarea").fill(ideaText);
    await window.getByRole("button", { name: "Park for Later" }).click();

    const idea = window.getByTestId("plan-idea-item").filter({ hasText: ideaText });
    await expect(idea.getByTestId("plan-idea-status")).toHaveText("Parked");
    await idea.getByRole("button", { name: "Dismiss" }).click();
    await expect(idea.getByTestId("plan-idea-status")).toHaveText("Dismissed");
    await expect(idea.getByRole("button", { name: "Restore" })).toBeVisible();
    await expect(idea.getByRole("button", { name: "Keep" })).toHaveCount(0);
    await expect(idea.getByRole("button", { name: "Prepare" })).toHaveCount(0);
    await idea.getByRole("button", { name: "Restore" }).click();
    await expect(idea.getByTestId("plan-idea-status")).toHaveText("Parked");
    await expect(idea.getByRole("button", { name: "Prepare" })).toBeVisible();
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const plan = Object.values(state.planningByWorkspace).find(
        (entry) => entry.selectedPlan?.name === "Composer restore plan",
      )?.selectedPlan;
      const item = plan?.parkedItems.find((entry) => entry.text === ideaText);
      return {
        reviewStatus: item?.reviewStatus ?? "",
        reviewNote: item?.reviewNote ?? "",
      };
    }).toEqual({
      reviewStatus: "parked",
      reviewNote: "Parked for later review",
    });
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
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Composer restore plan");
    const restoredIdea = window.getByTestId("plan-idea-item").filter({ hasText: ideaText });
    await expect(restoredIdea.getByTestId("plan-idea-status")).toHaveText("Parked");
    await restoredIdea.getByRole("button", { name: "Prepare" }).click();
    await expect(restoredIdea.getByTestId("plan-idea-status")).toHaveText("Ready to promote");
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
    await window.getByRole("button", { name: "Create Plan" }).click();
    await expect(window.getByTestId("plan-composer-prompt")).toHaveText("What should we call this project?");
    await window.getByTestId("plan-composer-textarea").fill("Composer Restart Plan");
    await window.getByLabel("Save Answer").click();

    await expect(window.getByTestId("plan-composer-prompt")).toHaveText(
      "What are we building, and what outcome should it create?",
    );
    await window.getByTestId("plan-composer-textarea").fill("Park restart-risk cleanup for later");
    await window.getByRole("button", { name: "Park for Later" }).click();
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
    await expect(window.getByTestId("plan-composer-prompt")).toHaveText(
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
    await window.getByRole("button", { name: "Create Plan" }).click();

    for (const [prompt, answer] of discussAnswers.slice(0, 7)) {
      await expect(window.getByTestId("plan-composer-prompt")).toHaveText(prompt);
      await window.getByTestId("plan-composer-textarea").fill(answer);
      await window.getByLabel("Save Answer").click();

      if (prompt === projectDepthGatePrompt) {
        await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
        await window.getByRole("button", { name: "Confirm Project" }).click();
      }
    }

    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Requirements");
    await expect(window.getByTestId("plan-composer-prompt")).toHaveText(
      "What must the first useful version be able to do?",
    );
    await window.getByTestId("plan-composer-textarea").fill("yes");
    await window.getByLabel("Save Answer").click();

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
    await window.getByRole("button", { name: "Create Plan" }).click();

    const answersWithUnresolvedGuidance = [
      ["What should we call this project?", "not sure"],
      ...discussAnswers.slice(1),
    ] as const;
    const savedAnswerCount = answersWithUnresolvedGuidance.length;

    for (const [prompt, answer] of answersWithUnresolvedGuidance) {
      await expect(window.getByTestId("plan-composer-prompt")).toHaveText(prompt);
      await window.getByTestId("plan-composer-textarea").fill(answer);
      await window.getByLabel("Save Answer").click();

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
    await expect(window.getByTestId("plan-discuss-complete").getByRole("button", { name: "Start Research" })).toBeDisabled();
    await window.getByTestId("plan-readiness-override-checkbox").check();
    await expect(window.getByTestId("plan-discuss-complete").getByRole("button", { name: "Start Research" })).toBeEnabled();
    await window.getByTestId("plan-discuss-complete").getByRole("button", { name: "Start Research" }).click();
    await expect(window.getByTestId("plan-research-panel")).toBeVisible();
    await window.getByTestId("research-title-input").fill("Readiness research");
    await window.getByTestId("research-content-textarea").fill("Findings: unresolved guidance remains visible at handoff gates.");
    await window.getByRole("button", { name: "Stage Research" }).click();
    await window.getByTestId("research-output-proposed").getByRole("button", { name: "Accept" }).click();
    await expect(window.getByTestId("plan-ready-card")).toBeVisible();
    await expect(window.getByTestId("plan-ready-card").getByTestId("plan-readiness-warning")).toContainText(
      "1 unresolved guidance item",
    );
    await expect(window.getByTestId("plan-ready-card").getByRole("button", { name: "Start Plan" })).toBeEnabled();
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
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      return state.globalPlanningPreferences.phaseModels.discuss?.modelId ?? "";
    }).toBe("gpt-5");
    await window.getByTestId("global-phase-model-select-research").selectOption("openai:gpt-4o");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      return state.globalPlanningPreferences.phaseModels.research?.modelId ?? "";
    }).toBe("gpt-4o");
    await window.getByTestId("global-phase-model-select-execute").selectOption("openai:gpt-5");
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      return [
        state.globalPlanningPreferences.phaseModels.discuss?.modelId,
        state.globalPlanningPreferences.phaseModels.research?.modelId,
        state.globalPlanningPreferences.phaseModels.execute?.modelId,
      ].join(":");
    }).toBe("gpt-5:gpt-4o:gpt-5");

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(window.getByTestId("plan-builder-title")).toHaveText(`Build a plan for ${workspaceName}`);
    await window.getByTestId("plan-name-input").fill("Launch plan");
    await window.getByRole("button", { name: "Create Plan" }).click();
    await expect(window.getByTestId("plan-outline-title")).toHaveText("Launch plan");
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Project");
    await expect(window.getByTestId("workflow-guidance-next-action")).toContainText("Answer the project question below");
    await expect(window.getByTestId("plan-composer-prompt")).toHaveText("What should we call this project?");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("guided-discuss-project.md");
    await expect(window.getByTestId("workflow-preferences-card")).toHaveCount(0);
    await expect(window.getByTestId("phase-model-select-discuss")).toHaveCount(0);
    await window.getByRole("button", { name: "Project Preferences", exact: true }).click();
    await expect(window.getByTestId("project-preferences-view")).toBeVisible();
    await window.getByTestId("apply-workflow-preferences-button").click();
    await expect(window.getByTestId("workflow-preferences-status")).toHaveText("Saved");
    await expect(window.getByTestId("phase-model-select-discuss")).toHaveValue("");
    await expect(window.getByTestId("phase-model-select-execute")).toBeVisible();
    await expect(window.getByTestId("phase-model-global-discuss")).toContainText("GPT-5");
    await expect(window.getByTestId("phase-model-project-discuss")).toHaveText("This project: Use team default");
    await expect(window.getByTestId("phase-model-resolved-discuss")).toHaveText(
      "Will use: openai/gpt-5 (Settings)",
    );
    await expect(window.getByTestId("phase-model-global-plan")).toHaveText("Team default: Not set");
    await expect(window.getByTestId("phase-model-project-plan")).toHaveText("This project: Use team default");
    await expect(window.getByTestId("phase-model-resolved-plan")).toContainText("Will use:");
    await expect(window.getByTestId("workflow-preferences-summary")).toContainText("supervised runs");
    await window.getByTestId("phase-model-select-execute").selectOption("openai:gpt-4o");
    await expect(window.getByTestId("phase-model-project-execute")).toContainText("GPT-4o");
    await expect(window.getByTestId("phase-model-resolved-execute")).toHaveText(
      "Will use: openai/gpt-4o (this project)",
    );
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
    expect(preferencesProjection).toContain("autonomous_run:");
    expect(preferencesProjection).toContain("milestone-complete");
    expect(preferencesProjection).toContain("guardrails:");
    expect(preferencesProjection).toContain("Dirty worktree conflict");
    expect(preferencesProjection).toContain("phase_overrides:");
    expect(preferencesProjection).toContain("execute:");
    expect(preferencesProjection).toContain("model: gpt-4o");
    const researchDecision = JSON.parse(
      await readFile(join(workspacePath, ".gsd", "runtime", "research-decision.json"), "utf8"),
    ) as { decision: string; source: string };
    expect(researchDecision.decision).toBe("skip");
    expect(researchDecision.source).toBe("workflow-preferences");
    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(window.getByTestId("plan-composer-prompt")).toHaveText("What should we call this project?");
    await window.getByTestId("plan-composer-textarea").fill("not sure");
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
    await window.getByTestId("plan-composer-textarea").fill("");
    await expect(window.getByTestId("adaptive-follow-up")).toHaveCount(0);
    for (const idea of [
      "Later automation follow-up",
      "Prepare integration change",
      "Tighten primary task acceptance",
      "Drop onboarding banner",
    ]) {
      await window.getByTestId("plan-composer-textarea").fill(idea);
      await window.getByRole("button", { name: "Park for Later" }).click();
      await expect(window.getByTestId("plan-idea-pool")).toContainText(idea);
    }
    await expect(window.getByTestId("plan-composer-prompt")).toHaveText("What should we call this project?");
    await expect(window.getByTestId("plan-composer-textarea")).toHaveValue("");
    const keptIdea = window.getByTestId("plan-idea-item").filter({ hasText: "Later automation follow-up" });
    await keptIdea.getByRole("button", { name: "Keep" }).click();
    await expect(keptIdea.getByTestId("plan-idea-status")).toHaveText("Kept");
    const promotionIdea = window.getByTestId("plan-idea-item").filter({ hasText: "Prepare integration change" });
    await promotionIdea.getByRole("button", { name: "Prepare" }).click();
    await expect(promotionIdea.getByTestId("plan-idea-status")).toHaveText("Ready to promote");
    await promotionIdea.getByRole("button", { name: "Draft Change" }).click();
    await expect(promotionIdea.getByTestId("plan-change-draft-form")).toBeVisible();
    await promotionIdea.getByTestId("plan-change-title-input").fill("Integration change draft");
    await promotionIdea
      .getByTestId("plan-change-summary-textarea")
      .fill("Prepare the integration change before it enters the active plan.");
    await promotionIdea
      .getByTestId("plan-change-impact-textarea")
      .fill("Impact: review roadmap boundaries, task dependencies, and verification evidence before approval.");
    await promotionIdea.getByRole("button", { name: "Save Draft" }).click();
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Integration change draft");
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Impact: review roadmap boundaries");
    const modificationIdea = window.getByTestId("plan-idea-item").filter({ hasText: "Tighten primary task acceptance" });
    await modificationIdea.getByRole("button", { name: "Prepare" }).click();
    await expect(modificationIdea.getByTestId("plan-idea-status")).toHaveText("Ready to promote");
    await modificationIdea.getByRole("button", { name: "Draft Change" }).click();
    await expect(modificationIdea.getByTestId("plan-change-draft-form")).toBeVisible();
    await modificationIdea.getByTestId("plan-change-title-input").fill("Primary task acceptance update");
    await modificationIdea
      .getByTestId("plan-change-summary-textarea")
      .fill("Tighten the primary task acceptance before execution starts.");
    await modificationIdea
      .getByTestId("plan-change-impact-textarea")
      .fill("Impact: acceptance must include generated projections and change-control persistence.");
    await modificationIdea.getByRole("button", { name: "Save Draft" }).click();
    await expect(window.getByTestId("plan-change-proposals")).toContainText("Primary task acceptance update");
    const dismissedIdea = window.getByTestId("plan-idea-item").filter({ hasText: "Drop onboarding banner" });
    await dismissedIdea.getByRole("button", { name: "Dismiss" }).click();
    await expect(dismissedIdea.getByTestId("plan-idea-status")).toHaveText("Dismissed");

    for (const [prompt, answer] of discussAnswers) {
      await expect(window.getByTestId("plan-composer-prompt")).toHaveText(prompt);
      await window.getByTestId("plan-composer-textarea").fill(answer);
      await window.getByLabel("Save Answer").click();

      if (prompt === projectDepthGatePrompt) {
        await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
        await window.getByRole("button", { name: "Confirm Project" }).click();
        await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Requirements");
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
        await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Milestone");
        await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("guided-discuss-milestone.md");
      }
    }

    await expect(window.getByTestId("plan-depth-gate")).toBeVisible();
    await window.getByRole("button", { name: "Confirm Milestone" }).click();
    await expect(window.getByTestId("plan-discuss-complete")).toBeVisible();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Research decision");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("guided-research-decision.md");
    await window.getByTestId("plan-discuss-complete").getByRole("button", { name: "Start Research" }).click();
    await expect(window.getByTestId("plan-research-panel")).toBeVisible();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Research");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("guided-research-project.md");
    await expect(window.getByTestId("research-content-textarea")).toContainText("Research checks:");
    await window.getByTestId("research-title-input").fill("Codebase and workflow research");
    await window
      .getByTestId("research-content-textarea")
      .fill("Findings: Planning state lives in the GSD database, and research output must be accepted before PLAN.");
    await window.getByRole("button", { name: "Stage Research" }).click();
    await expect(window.getByTestId("research-output-proposed")).toContainText("Codebase and workflow research");
    await window.getByRole("button", { name: "Accept" }).click();
    await expect(window.getByTestId("plan-ready-card")).toBeVisible();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Plan");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("plan-milestone.md / plan-slice.md");
    await window.getByTestId("plan-ready-card").getByRole("button", { name: "Start Plan" }).click();
    await expect(window.getByTestId("plan-proposal-panel")).toBeVisible();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Plan");
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
    await window.getByRole("button", { name: "Stage Plan" }).click();
    const draftPlan = window.getByTestId("plan-output-proposed").locator(".plan-research-output").filter({ hasText: "Draft" });
    await expect(draftPlan).toContainText("Unknown dependency T404");
    await expect(draftPlan.getByRole("button", { name: "Accept plan" })).toBeDisabled();
    await window.getByTestId("plan-task-dependencies-input").fill("");
    const requirementRefs = window.getByTestId("plan-task-requirements-input");
    await requirementRefs.fill("R999");
    await expect(window.getByTestId("plan-validation-errors").first()).toContainText("Unknown requirement R999");
    await window.getByRole("button", { name: "Stage Plan" }).click();
    const blockedRequirementPlan = window
      .getByTestId("plan-output-proposed")
      .locator(".plan-research-output")
      .filter({ hasText: "Unknown requirement R999" });
    await expect(blockedRequirementPlan).toContainText("Draft");
    await expect(blockedRequirementPlan.getByRole("button", { name: "Accept plan" })).toBeDisabled();
    await requirementRefs.fill("R001");
    await expect(window.getByTestId("plan-validation-errors").first()).toContainText("Validation passed");
    await expect(window.getByTestId("plan-coverage-warnings").first()).toContainText("R002");
    await requirementRefs.fill("R001, R002");
    await expect(requirementRefs).toHaveValue("R001, R002");
    await expect(window.getByTestId("plan-validation-errors").first()).toContainText("Validation passed");
    await window.getByRole("button", { name: "Stage Plan" }).click();
    const proposedPlan = window.getByTestId("plan-output-proposed").locator(".plan-research-output").filter({ hasText: "Proposed" });
    await proposedPlan.getByRole("button", { name: "Accept plan" }).click();
    await expect(window.getByTestId("plan-output-accepted")).toContainText("Plan proposal");
    await expect(window.getByTestId("plan-output-accepted")).toContainText("Reqs R001, R002");
    await expect(window.getByTestId("projection-summary")).toContainText("Saved Files");
    await access(join(workspacePath, ".gsd", "PROJECT.md"));
    await access(join(workspacePath, ".gsd", "REQUIREMENTS.md"));
    await access(join(workspacePath, ".gsd", "STATE.md"));
    await access(join(workspacePath, ".gsd", "NEXT.md"));
    const modificationProposal = window.getByTestId("plan-change-proposal").filter({ hasText: "Primary task acceptance update" });
    await expect(modificationProposal.getByTestId("plan-modification-form")).toBeVisible();
    await modificationProposal.getByTestId("plan-modification-task-select").selectOption("M1/S1/T1");
    await modificationProposal
      .getByTestId("plan-modification-task-acceptance-textarea")
      .fill("No lost answers, projection state, and change-control persistence are verified.");
    await modificationProposal.getByRole("button", { name: "Approve modification" }).click();
    await expect(modificationProposal.getByTestId("plan-change-proposal-status")).toHaveText("Approved");
    await expect(modificationProposal).toContainText("Modified M1/S1/T1");
    await expect(modificationProposal.getByTestId("plan-change-proposal-activity")).toHaveCount(0);
    await expect(modificationProposal.getByTestId("plan-change-proposal-activity-toggle")).toHaveText("History 2");
    await modificationProposal.getByTestId("plan-change-proposal-activity-toggle").click();
    const modificationActivity = modificationProposal.getByTestId("plan-change-proposal-activity");
    await expect(modificationActivity.getByTestId("plan-change-proposal-activity-entry")).toHaveCount(2);
    await expect(modificationActivity).toContainText("Drafted");
    await expect(modificationActivity).toContainText("Modified");
    await expect(modificationActivity).toContainText("Approved task modification M1/S1/T1");
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
    await expect(changeProposal.getByRole("button", { name: "Restore injected task" })).toBeEnabled();
    await changeProposal.getByRole("button", { name: "Restore injected task" }).click();
    await expect(changeProposal.getByTestId("plan-hidden-task-note")).toHaveCount(0);
    await expect(changeProposal.getByTestId("plan-hide-task-form")).toBeVisible();
    await expect(window.getByTestId("plan-output-accepted")).toContainText("Restored task - M1/S1/T2");
    await expect.poll(async () => {
      try {
        await access(injectedTaskPath);
        return "exists";
      } catch {
        return "missing";
      }
    }).toBe("exists");
    await changeProposal
      .getByTestId("plan-hide-task-reason-textarea")
      .fill("Integration review moved out of the active execution path.");
    await changeProposal.getByRole("button", { name: "Hide injected task" }).click();
    await expect(changeProposal.getByTestId("plan-hidden-task-note")).toContainText("Hidden from active plan");
    await expect.poll(async () => {
      try {
        await access(injectedTaskPath);
        return "exists";
      } catch {
        return "missing";
      }
    }).toBe("missing");
    await expect(changeProposal.getByTestId("plan-change-proposal-activity")).toHaveCount(0);
    await expect(changeProposal.getByTestId("plan-change-proposal-activity-toggle")).toHaveText("History 5");
    await changeProposal.getByTestId("plan-change-proposal-activity-toggle").click();
    const proposalActivity = changeProposal.getByTestId("plan-change-proposal-activity");
    await expect(proposalActivity.getByTestId("plan-change-proposal-activity-entry")).toHaveCount(5);
    await expect(proposalActivity).toContainText("Drafted");
    await expect(proposalActivity).toContainText("Approved as new task M1/S1/T2");
    await expect(proposalActivity).toContainText("Hidden injected task M1/S1/T2");
    await expect(proposalActivity).toContainText("Restored injected task M1/S1/T2");

    const nameMemory = window.getByTestId("plan-answer-history").locator(".plan-memory__item").filter({ hasText: "Name" });
    await expect(nameMemory.getByTestId("plan-memory-question")).toHaveText("What should we call this project?");
    await nameMemory.getByRole("button", { name: "Edit" }).click();
    await window.getByTestId("plan-revision-textarea").fill("Launch Control Revised");
    await nameMemory.getByRole("button", { name: "Save Revision" }).click();
    await expect(nameMemory).toContainText("Launch Control Revised");
    await expect(nameMemory.getByTestId("plan-memory-question")).toHaveText("What should we call this project?");
    const projectProjectionPath = join(workspacePath, ".gsd", "PROJECT.md");
    const staleProjectProjection = await readFile(projectProjectionPath, "utf8");
    await writeFile(
      projectProjectionPath,
      staleProjectProjection.replace("# Project: Launch Control", "# Project: Stale Launch Control"),
      "utf8",
    );
    await rm(join(workspacePath, ".gsd", "NEXT.md"), { force: true });
    await window.getByTestId("regenerate-projections-button").click();
    await expect(window.getByTestId("projection-summary")).toContainText("written");
    await expect(window.getByTestId("projection-summary")).toContainText("1 missing / 2 stale");
    await expect(window.getByTestId("regenerate-projections-button")).toHaveText("Repair Saved Files");

    const projectProjection = await readFile(projectProjectionPath, "utf8");
    expect(projectProjection).toContain("pi-gui-plan-builder-generated");
    expect(projectProjection).toContain("# Project: Launch Control Revised");
    expect(projectProjection).toContain("**Complexity:** complex");
    expect(projectProjection).toContain(
      "**Why:** complex - database-backed planning, projections, and execution lifecycle state.",
    );
    await window.getByTestId("regenerate-projections-button").click();
    await expect(window.getByTestId("projection-summary")).toContainText("current");
    await expect(window.getByTestId("regenerate-projections-button")).toHaveText("Refresh Saved Files");
    const requirementsProjectionPath = join(workspacePath, ".gsd", "REQUIREMENTS.md");
    await writeFile(requirementsProjectionPath, "# Hand-written requirements\n", "utf8");
    await window.getByTestId("regenerate-projections-button").click();
    await expect(window.getByTestId("projection-summary")).toContainText("1 imported file conflict");
    await expect(window.getByTestId("regenerate-projections-button")).toHaveCount(0);
    await expect(window.getByTestId("overwrite-legacy-projections-button")).toHaveText("Replace Imported Files");
    await expect(window.getByTestId("start-execution-button")).toBeDisabled();
    await window.getByTestId("overwrite-legacy-projections-button").click();
    await expect(window.getByTestId("projection-summary")).not.toContainText("imported file conflict");
    await expect(window.getByTestId("start-execution-button")).toBeEnabled();
    const requirementsProjection = await readFile(requirementsProjectionPath, "utf8");
    expect(requirementsProjection).toContain("### R001: First useful version capabilities");
    expect(requirementsProjection).toContain("Create a plan, ask focused questions, save answers, and resume after restart.");
    expect(requirementsProjection).toContain("### R002: Quality bar");
    expect(requirementsProjection).toContain("| R001 | M1/none yet | user | unvalidated |");
    expect(requirementsProjection).toContain("## Plan Coverage");
    expect(requirementsProjection).toContain("| R001 | active | covered | M1/S1/T1 |");
    expect(requirementsProjection).toContain("| R003 | active | uncovered | _None_ |");
    expect(requirementsProjection).toContain("Active: 4");
    const nextProjection = await readFile(join(workspacePath, ".gsd", "NEXT.md"), "utf8");
    expect(nextProjection).toContain("# Next Work");
    expect(nextProjection).toContain("**Active Plan:**");
    expect(nextProjection).toContain("**Queue:** 1 ready / 0 blocked");
    expect(nextProjection).toContain("M1/S1/T1: Implement and verify the slice");
    expect(nextProjection).toContain(".gsd/milestones/M1/slices/S1/tasks/T1-PLAN.md");
    const roadmapProjection = await readFile(join(workspacePath, ".gsd", "milestones", "M1", "M1-ROADMAP.md"), "utf8");
    expect(roadmapProjection).toContain("Plan Builder vertical slice");
    expect(roadmapProjection).toContain("**Phase:** P2 - Hardening");
    expect(roadmapProjection).toContain("`reqs:[R001,R002]`");
    expect(projectProjection).toContain("## Phase Sequence");
    expect(projectProjection).toContain("P2: Hardening");
    const milestoneContextProjection = await readFile(join(workspacePath, ".gsd", "milestones", "M1", "M1-CONTEXT.md"), "utf8");
    expect(milestoneContextProjection).toContain("P2: Hardening");
    expect(milestoneContextProjection).toContain("Stabilize projections and lifecycle gates.");
    const sliceProjection = await readFile(join(workspacePath, ".gsd", "milestones", "M1", "slices", "S1", "S1-PLAN.md"), "utf8");
    expect(sliceProjection).not.toContain("Review integration impact");
    const primaryTaskProjection = await readFile(join(workspacePath, ".gsd", "milestones", "M1", "slices", "S1", "tasks", "T1-PLAN.md"), "utf8");
    expect(primaryTaskProjection).toContain("No lost answers, projection state, and change-control persistence are verified.");
    expect(primaryTaskProjection).toContain("**Requirements:** R001, R002");
    await window.getByTestId("start-execution-button").click();
    await expect(window.getByTestId("plan-execution-panel")).toBeVisible();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Execute");
    await expect(window.getByTestId("workflow-guidance-prompt-source")).toContainText("execute-task.md");
    await expect(window.getByTestId("plan-execution-panel")).toContainText("Plan Builder vertical slice");
    await expect(window.getByTestId("plan-execution-panel")).not.toContainText("Review integration impact");
    const executeRoute = window
      .getByTestId("phase-model-routing-summary")
      .getByTestId("phase-model-routing-row")
      .filter({ hasText: "EXECUTE" });
    await expect(executeRoute).toContainText("openai/gpt-4o");
    await expect(executeRoute).toContainText("project override");
    await expect(window.getByTestId("handoff-bundle-text")).toHaveValue(/EXECUTE: project override - openai\/gpt-4o/);
    const primaryExecutionTask = window.getByTestId("execution-task").filter({ hasText: "Implement and verify the slice" });
    await primaryExecutionTask.getByTestId("link-task-session-button").click();
    await expect(primaryExecutionTask.getByTestId("execution-task-link")).toContainText("Task T1 - Implement and verify the slice");
    await expect(primaryExecutionTask.getByTestId("execution-task-link")).toContainText(
      "Execution model: project override (openai/gpt-4o)",
    );
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
    await expect(window.getByTestId("composer")).toHaveValue(/# Execute M1\/S1\/T1: Implement and verify the slice/);
    await expect(window.getByTestId("composer")).toHaveValue(/Dependencies: None/);
    await expect(window.getByTestId("composer")).toHaveValue(/Source: project override/);
    await expect(window.getByTestId("composer")).toHaveValue(/Model: openai\/gpt-4o/);
    await expect(window.getByTestId("composer")).toHaveValue(/R001 \(active, functional\): First useful version capabilities/);
    await expect(window.getByTestId("composer")).toHaveValue(/Evidence should prove: No lost answers/);
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
    await expect(primaryExecutionTask.getByTestId("task-evidence-list")).toContainText(
      "Source: Task T1 - Implement and verify the slice",
    );
    await expect(window.getByTestId("start-verify-button")).toBeEnabled();
    await window.getByTestId("start-verify-button").click();
    await expect(window.getByTestId("plan-verify-panel")).toBeVisible();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Verify");
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
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Ship");
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
    await expect(window.getByTestId("workflow-preferences-card")).toHaveCount(0);
    await expect(window.getByTestId("phase-model-select-execute")).toHaveCount(0);
    await window.getByRole("button", { name: "Project Preferences", exact: true }).click();
    await expect(window.getByTestId("project-preferences-view")).toBeVisible();
    await expect(window.getByTestId("workflow-preferences-status")).toHaveText("Saved");
    await expect(window.getByTestId("phase-model-select-execute")).toHaveValue("openai:gpt-4o");
    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(window.getByTestId("workflow-guidance-banner")).toHaveText("Ship");
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
        state.globalPlanningPreferences.phaseModels.execute?.modelId === "gpt-5" &&
        Object.values(state.planningByWorkspace).some(
          (entry) =>
            entry.selectedPlan?.name === "Launch plan" &&
            entry.selectedPlan.activePhase === "ship" &&
            entry.selectedPlan.workflowPreferences?.commitPolicy === "per-task" &&
            entry.selectedPlan.workflowPreferences?.branchModel === "single" &&
            entry.selectedPlan.workflowPreferences?.autonomousRun.mode === "supervised" &&
            entry.selectedPlan.workflowPreferences?.autonomousRun.stopConditions.includes("milestone-complete") &&
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
              proposal.injectedTaskPath === "M1/S1/T2" &&
              proposal.activity.filter((activity) => activity.type === "task-hidden").length === 2 &&
              proposal.activity.some((activity) => activity.type === "task-restored"),
          ) &&
          entry.selectedPlan.changeProposals.some(
            (proposal) =>
              proposal.title === "Primary task acceptance update" &&
              proposal.status === "approved" &&
              proposal.modifiedTaskPath === "M1/S1/T1" &&
              proposal.activity.some((activity) => activity.type === "task-modified"),
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
          entry.selectedPlan.taskSessionLinks.some(
            (link) =>
              link.taskId === "T1" &&
              link.sessionId.length > 0 &&
              link.executionModel?.source === "project-override" &&
              link.executionModel.modelId === "gpt-4o",
          ) &&
          entry.selectedPlan.taskExecutions.some(
            (task) =>
              task.taskId === "T1" &&
              task.status === "done" &&
              task.evidence.some(
                (evidence) =>
                  evidence.text === "Linked session created and reopened from EXECUTE." &&
                  evidence.sourceSessionTitle === "Task T1 - Implement and verify the slice",
              ),
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
              output.content.includes("\"requirementIds\"") &&
              output.content.includes("\"R001\"") &&
              output.content.includes("\"R002\"") &&
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
              output.title === "Restored task - M1/S1/T2" &&
              output.content.includes("Review integration impact"),
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
