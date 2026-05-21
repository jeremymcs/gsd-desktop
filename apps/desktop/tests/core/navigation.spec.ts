import { basename } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  addWorkspaceViaIpc,
  createNamedThread,
  getDesktopState,
  launchDesktop,
  makeUserDataDir,
  makeWorkspace,
  selectSession,
  streamAssistantDeltas,
  waitForWorkspaceByPath,
} from "../helpers/electron-app";

test("persists workspace, selected session, and draft across app restart", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("codex-style-folder");
  const draft = "Now summarize the project title in one sentence.";

  const firstRun = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });
  try {
    const window = await firstRun.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await createNamedThread(window, "Persistence session");

    const composer = window.getByTestId("composer");
    await composer.fill(draft);
    await expect(composer).toHaveValue(draft);
    await expect.poll(async () => (await getDesktopState(window)).composerDraft).toBe(draft);
  } finally {
    await firstRun.close();
  }

  const secondRun = await launchDesktop(userDataDir, { testMode: "background" });
  try {
    const window = await secondRun.firstWindow();
    const persistedWorkspace = await waitForWorkspaceByPath(window, workspacePath);
    await expect
      .poll(async () => {
        const state = await getDesktopState(window);
        return {
          selectedWorkspaceId: state.selectedWorkspaceId,
          selectedSessionId: state.selectedSessionId,
          hasPersistenceSession: state.workspaces.some((workspace) =>
            workspace.sessions.some((session) => session.title === "Persistence session"),
          ),
        };
      }, { timeout: 15_000 })
      .toMatchObject({
        selectedWorkspaceId: persistedWorkspace.id,
        hasPersistenceSession: true,
      });
    await expect(window.getByTestId("workspace-list")).toContainText(basename(workspacePath));
    await expect(window.locator(".session-row--active")).toContainText("Persistence session");
    await expect(window.getByTestId("composer")).toHaveValue(draft);

    const state = await getDesktopState(window);
    const selectedWorkspace = state.workspaces.find((workspace) => workspace.id === state.selectedWorkspaceId);
    expect(selectedWorkspace?.path).toBeTruthy();
    expect(state.selectedSessionId).not.toBe("");
    expect(state.workspaces.some((workspace) => workspace.path === selectedWorkspace?.path)).toBe(true);
    expect(state.workspaces.some((workspace) => workspace.sessions.some((session) => session.title === "Persistence session"))).toBe(
      true,
    );
  } finally {
    await secondRun.close();
  }
});

test("navigates across folders and sessions through the sidebar", async () => {
  const userDataDir = await makeUserDataDir();
  const alphaPath = await makeWorkspace("alpha-workspace");
  const betaPath = await makeWorkspace("beta-workspace");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [alphaPath, betaPath],
    testMode: "background",
  });
  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, alphaPath);
    await waitForWorkspaceByPath(window, betaPath);

    await createNamedThread(window, "Alpha session one", { workspaceName: basename(alphaPath) });
    await expect(window.locator(".session-row", { hasText: "Alpha session one" })).toHaveAttribute(
      "data-sidebar-indicator",
      "none",
    );

    await createNamedThread(window, "Alpha session two", { workspaceName: basename(alphaPath) });
    await createNamedThread(window, "Beta session one", { workspaceName: basename(betaPath) });

    await expect(window.locator(".topbar__session")).toHaveText("Beta session one");
    await expect(window.getByTestId("workspace-list")).toContainText(basename(alphaPath));
    await expect(window.getByTestId("workspace-list")).toContainText(basename(betaPath));
    await expect(window.locator(".project-header")).toContainText(basename(betaPath));
    await expect(window.locator(".session-row", { hasText: "Alpha session two" })).toHaveCount(0);

    await window.getByTestId("workspace-list").getByRole("button", { name: basename(alphaPath) }).click();
    await expect(window.locator(".project-header")).toContainText(basename(alphaPath));
    await expect(window.locator(".session-row", { hasText: "Alpha session two" })).toHaveAttribute(
      "data-sidebar-indicator",
      "none",
    );
    await selectSession(window, "Alpha session one");

    await window.getByTestId("workspace-list").getByRole("button", { name: basename(betaPath) }).click();
    await expect(window.locator(".project-header")).toContainText(basename(betaPath));
    await selectSession(window, "Beta session one");

    await window.getByRole("button", { name: "Search" }).click();
    await expect(window.getByTestId("project-search-scope")).toHaveValue("project");
    await window.getByTestId("project-search-input").fill("Alpha session one");
    await expect(window.getByTestId("project-search-results")).toContainText("No results.");
    await window.getByTestId("project-search-scope").selectOption("all");
    await expect(window.getByTestId("project-search-results")).toContainText("Alpha session one");
    await window.getByRole("button", { name: "Close" }).click();

    await expect
      .poll(async () => {
        const state = await getDesktopState(window);
        return {
          alphaSessions: state.workspaces.find((workspace) => workspace.path === alphaPath)?.sessions.length ?? 0,
          betaSessions: state.workspaces.find((workspace) => workspace.path === betaPath)?.sessions.length ?? 0,
        };
      })
      .toEqual({
        alphaSessions: 2,
        betaSessions: 1,
      });

    const state = await getDesktopState(window);
    const selectedWorkspace = state.workspaces.find((workspace) => workspace.id === state.selectedWorkspaceId);
    expect(selectedWorkspace?.path).toBeTruthy();
    expect(state.selectedSessionId).not.toBe("");
  } finally {
    await harness.close();
  }
});

test("workspace tabs keep multiple projects open and workspace page links route correctly", async () => {
  const userDataDir = await makeUserDataDir();
  const alphaPath = await makeWorkspace("workspace-tabs-alpha");
  const betaPath = await makeWorkspace("workspace-tabs-beta");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [alphaPath],
    testMode: "background",
  });
  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, alphaPath);

    await addWorkspaceViaIpc(window, betaPath);
    await waitForWorkspaceByPath(window, betaPath);

    await expect(window.getByTestId("workspace-list")).toContainText(basename(alphaPath));
    await expect(window.getByTestId("workspace-list")).toContainText(basename(betaPath));
    await expect.poll(() => workspaceTabLabels(window)).toEqual([basename(alphaPath), basename(betaPath)]);

    await window.getByTestId("workspace-list").getByRole("button", { name: basename(alphaPath) }).click();
    await expect(window.locator(".project-header")).toContainText(basename(alphaPath));
    await expect.poll(() => workspaceTabLabels(window)).toEqual([basename(alphaPath), basename(betaPath)]);

    await window.getByRole("button", { name: "Project Overview", exact: true }).click();
    await expect(window.getByTestId("project-home-view")).toBeVisible();
    await expect(window.getByTestId("new-thread-composer")).toHaveCount(0);

    await window.getByRole("button", { name: "Plans", exact: true }).click();
    await expect(window.getByTestId("plan-builder-view")).toBeVisible();

    await window.getByRole("button", { name: "Backlog", exact: true }).click();
    await expect(window.getByTestId("project-backlog-view")).toBeVisible();

    await window.getByRole("button", { name: "Worktrees", exact: true }).click();
    await expect(window.getByTestId("project-worktrees-view")).toBeVisible();

    await window.getByRole("button", { name: "Threads", exact: true }).click();
    await expect(window.getByTestId("project-threads-view")).toBeVisible();
    await expect(window.getByTestId("project-threads-recent")).toBeVisible();

    await window.getByRole("button", { name: "Skills", exact: true }).click();
    await expect(window.getByTestId("skills-surface")).toBeVisible();

    await window.getByRole("button", { name: "Extensions", exact: true }).click();
    await expect(window.getByTestId("extensions-surface")).toBeVisible();

    await window.getByRole("button", { name: "Project Preferences", exact: true }).click();
    await expect(window.getByTestId("project-preferences-view")).toBeVisible();

    await window.locator(".sidebar__footer").getByRole("button", { name: "Settings", exact: true }).click();
    await expect(window.locator(".settings-view")).toBeVisible();

    await window.getByTestId("workspace-list").getByRole("button", { name: basename(betaPath) }).click();
    await expect(window.locator(".project-header")).toContainText(basename(betaPath));
    await expect(window.getByTestId("project-home-view")).toBeVisible();
    await expect.poll(() => workspaceTabLabels(window)).toEqual([basename(alphaPath), basename(betaPath)]);

    await window.getByTestId("workspace-list").getByRole("button", { name: basename(alphaPath) }).click();
    await expect(window.locator(".project-header")).toContainText(basename(alphaPath));
    await expect.poll(() => workspaceTabLabels(window)).toEqual([basename(alphaPath), basename(betaPath)]);

    await expect
      .poll(async () => {
        const state = await getDesktopState(window);
        return state.workspaces.map((workspace) => workspace.path).sort();
      })
      .toEqual([alphaPath, betaPath].sort());
  } finally {
    await harness.close();
  }
});

test("saves highlighted thread text to the project backlog", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("backlog-capture-workspace");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });
  try {
    const window = await harness.firstWindow();
    const workspace = await waitForWorkspaceByPath(window, workspacePath);

    await createNamedThread(window, "Backlog capture thread");
    await streamAssistantDeltas(harness, window, ["Build feature one now. Save feature two for later."]);
    await selectThreadText(window, "Save feature two for later.");

    await expect(window.getByTestId("selection-backlog-popover")).toBeVisible();
    await window.getByTestId("selection-backlog-popover").getByRole("button", { name: "Save for later" }).click();

    await expect(window.getByTestId("backlog-capture-toast")).toContainText("Saved to backlog.");
    await expect
      .poll(async () => {
        const item = (await getDesktopState(window)).backlogByWorkspace[workspace.id]?.[0];
        return item ? { category: item.category, status: item.status, text: item.text } : undefined;
      })
      .toEqual({
        category: "follow-up",
        status: "open",
        text: "Save feature two for later.",
      });

    await expect(window.getByTestId("backlog-capture-toast")).toBeHidden({ timeout: 5_000 });
    await window.getByRole("button", { name: "Backlog", exact: true }).click();
    await expect(window.getByTestId("project-backlog-view")).toBeVisible();
    const backlogItem = window.getByTestId("project-backlog-item");
    await expect(backlogItem).toContainText("Save feature two for later.");
    await expect(backlogItem).toContainText("Follow-up");

    await backlogItem.getByRole("button", { name: "Start Thread" }).click();
    await expect(window.getByTestId("new-thread-composer")).toContainText("Save feature two for later.");
    await window.getByRole("button", { name: "Start Thread" }).click();
    await expect
      .poll(async () => {
        const item = (await getDesktopState(window)).backlogByWorkspace[workspace.id]?.[0];
        return item
          ? {
              hasDiscussionThread: Boolean(item.discussionThread?.sessionId),
              status: item.status,
            }
          : undefined;
      })
      .toEqual({
        hasDiscussionThread: true,
        status: "in-discussion",
      });

    await window.getByRole("button", { name: "Threads", exact: true }).click();
    await expect(window.getByTestId("project-threads-view")).toBeVisible();
    await expect(window.getByTestId("project-threads-follow-ups")).toContainText("Follow-up · Local");
    await expect(window.getByTestId("project-threads-follow-ups").getByTestId("project-thread-item")).toHaveCount(1);

    await window.getByRole("button", { name: "Backlog", exact: true }).click();
    await window.getByRole("button", { name: "Mark Done" }).click();
    await expect
      .poll(async () => (await getDesktopState(window)).backlogByWorkspace[workspace.id]?.[0]?.status)
      .toBe("done");
    await expect(window.getByText("Done")).toBeVisible();
  } finally {
    await harness.close();
  }
});

test("switching sessions republishes the selected transcript", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("session-switch-transcript-workspace");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await createNamedThread(window, "Thread one");
    await streamAssistantDeltas(harness, window, ["alpha response"]);
    await expect(window.getByTestId("transcript")).toContainText("alpha response");

    await createNamedThread(window, "Thread two");
    await streamAssistantDeltas(harness, window, ["beta response"]);
    await expect(window.getByTestId("transcript")).toContainText("beta response");

    await selectSession(window, "Thread one");
    await expect(window.locator(".topbar__session")).toHaveText("Thread one");
    await expect(window.getByTestId("transcript")).toContainText("alpha response");
    await expect(window.getByTestId("transcript")).not.toContainText("Loading thread...");

    await selectSession(window, "Thread two");
    await expect(window.locator(".topbar__session")).toHaveText("Thread two");
    await expect(window.getByTestId("transcript")).toContainText("beta response");
    await expect(window.getByTestId("transcript")).not.toContainText("Loading thread...");
  } finally {
    await harness.close();
  }
});

async function workspaceTabLabels(window: Page) {
  return window.locator(".workspace-tabs__tab:not(.workspace-tabs__tab--empty) span").allTextContents();
}

async function selectThreadText(window: Page, text: string): Promise<void> {
  await window.locator("[data-backlog-message-id]", { hasText: text }).first().evaluate((node, selectedText) => {
    const ownerDocument = node.ownerDocument;
    const ownerWindow = ownerDocument.defaultView;
    if (!ownerWindow) {
      throw new Error("Window unavailable");
    }

    const walker = ownerDocument.createTreeWalker(node, ownerWindow.NodeFilter.SHOW_TEXT);
    let target: Text | null = null;
    while (walker.nextNode()) {
      const current = walker.currentNode;
      if (current.textContent?.includes(selectedText)) {
        target = current as Text;
        break;
      }
    }
    if (!target || !target.textContent) {
      throw new Error(`Text not found: ${selectedText}`);
    }

    const start = target.textContent.indexOf(selectedText);
    const range = ownerDocument.createRange();
    range.setStart(target, start);
    range.setEnd(target, start + selectedText.length);

    const selection = ownerWindow.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    node.dispatchEvent(new ownerWindow.MouseEvent("mouseup", { bubbles: true }));
  }, text);
}
