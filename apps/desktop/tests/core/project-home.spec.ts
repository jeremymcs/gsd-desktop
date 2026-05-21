import { expect, test } from "@playwright/test";
import {
  createNamedThread,
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

    await window.getByRole("button", { name: "Home", exact: true }).click();

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
