import { expect, test } from "@playwright/test";
import {
  createNamedThread,
  getDesktopState,
  launchDesktop,
  makeUserDataDir,
  makeWorkspace,
  seedTranscriptMessages,
  waitForWorkspaceByPath,
} from "../helpers/electron-app";

test("project home clamps long recent thread previews", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("project-home-long-preview");
  const longPreview = [
    "## Recommended Next Features ### 1. Quality & Compliance Command Center",
    "**Why now:** This is already the next stated direction and the preview can include planning evidence, file paths, and implementation notes.",
    "**Suggested first slice:** Build documentation completeness monitoring with filters, status, review notes, and audit trail.",
    "**Effort/risk:** Medium effort, low product risk.",
  ].join(" ");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });
  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await createNamedThread(window, "Long preview thread");
    await seedTranscriptMessages(harness, window, {
      count: 1,
      textFactory: () => longPreview,
    });

    await window.getByRole("button", { name: "Project Overview", exact: true }).click();
    await expect(window.getByTestId("project-home-view").getByText("Project Overview")).toBeVisible();
    await expect(window.getByRole("button", { name: "Start Guided Plan" })).toBeVisible();

    const preview = window.locator(".project-home__thread-preview").first();
    await expect(preview).toHaveText(longPreview);

    const metrics = await preview.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        height: element.getBoundingClientRect().height,
        lineClamp: style.webkitLineClamp,
        lineHeight: Number.parseFloat(style.lineHeight),
        overflow: style.overflow,
      };
    });

    expect(metrics.lineClamp).toBe("2");
    expect(metrics.overflow).toBe("hidden");
    expect(metrics.height).toBeLessThanOrEqual(metrics.lineHeight * 2 + 2);
  } finally {
    await harness.close();
  }
});

test("reconciles ad hoc task threads into Backlog tasks", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("project-home-ad-hoc-task");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });
  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await createNamedThread(window, "Investigate flaky install task");
    await seedTranscriptMessages(harness, window, {
      count: 1,
      textFactory: () => "Found an install cleanup task that should be reconciled before planning changes.",
    });

    await window.getByRole("button", { name: "Project Overview", exact: true }).click();
    const reconciliation = window.getByTestId("ad-hoc-reconciliation");
    await expect(reconciliation.getByTestId("ad-hoc-thread-row")).toContainText("Investigate flaky install task");
    await reconciliation.getByRole("button", { name: "Save Task" }).click();

    await expect(reconciliation.getByTestId("ad-hoc-thread-row")).toContainText("Saved to Backlog");
    await expect(reconciliation.getByRole("button", { name: "Saved" })).toBeDisabled();
    await expect.poll(async () => {
      const state = await getDesktopState(window);
      const workspace = state.workspaces.find((entry) => entry.path === workspacePath);
      const items = workspace ? state.backlogByWorkspace[workspace.id] ?? [] : [];
      return items.find((item) => item.source.label.includes("Investigate flaky install task"));
    }).toMatchObject({
      category: "task",
      status: "open",
      text: "Reconcile ad hoc task from Investigate flaky install task",
      source: {
        role: "thread",
      },
    });
  } finally {
    await harness.close();
  }
});
