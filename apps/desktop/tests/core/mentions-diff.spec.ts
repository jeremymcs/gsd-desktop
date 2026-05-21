import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test, type Locator } from "@playwright/test";
import {
  commitAllInGitRepo,
  createNamedThread,
  desktopShortcut,
  initGitRepo,
  launchDesktop,
  makeUserDataDir,
  makeWorkspace,
} from "../helpers/electron-app";

test("shows workspace file mentions from the composer and inserts the selected file", async () => {
  test.setTimeout(30_000);
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("mention-workspace");
  await initGitRepo(workspacePath);
  await commitAllInGitRepo(workspacePath, "init");
  await mkdir(join(workspacePath, "src"), { recursive: true });
  await writeFile(join(workspacePath, "src", "App.tsx"), "export default App;\n", "utf8");
  await commitAllInGitRepo(workspacePath, "add src");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await createNamedThread(window, "Mention test");

    const composer = window.getByTestId("composer");
    await composer.click();
    await composer.pressSequentially("@");

    const mentionMenu = window.getByTestId("mention-menu");
    await expect(mentionMenu).toBeVisible();
    await expect(mentionMenu.locator(".mention-menu__item")).toHaveCount(2);
    const mentionFontFamily = await mentionMenu
      .locator(".mention-menu__item")
      .first()
      .evaluate((node) => getComputedStyle(node).fontFamily);
    expect(mentionFontFamily).not.toMatch(/mono/i);

    await composer.pressSequentially("READ");
    await expect(mentionMenu.locator(".mention-menu__item")).toHaveCount(1);
    await expect(mentionMenu.locator(".mention-menu__filename")).toContainText("README.md");

    await composer.press("Tab");
    await expect(mentionMenu).toHaveCount(0);
    await expect(composer).toHaveValue("@README.md ");
  } finally {
    await harness.close();
  }
});

test("toggles the diff panel from the keyboard shortcut and renders changed files on the right", async () => {
  test.setTimeout(30_000);
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("diff-workspace");
  await initGitRepo(workspacePath);
  await commitAllInGitRepo(workspacePath, "init");
  await writeFile(join(workspacePath, "README.md"), "# diff-workspace\nnew line\n", "utf8");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await createNamedThread(window, "Diff test");

    const diffPanel = window.locator(".diff-panel");
    await expect(diffPanel).toHaveCount(0);

    await window.keyboard.press(desktopShortcut("D"));
    await expect(diffPanel).toBeVisible();
    await expect(diffPanel.locator(".diff-panel__title")).toContainText("Changes");
    await expect(diffPanel.locator(".diff-panel__file-name")).toContainText("README.md");

    const changesTooltip = window.locator(".topbar__tooltip", { hasText: "Toggle Changes" });
    await window.getByLabel("Toggle Changes").hover();
    await expect(changesTooltip).toBeVisible();
    await expect.poll(() => contrastRatioFor(changesTooltip)).toBeGreaterThanOrEqual(4.5);

    const mainBox = await window.locator(".main").boundingBox();
    const panelBox = await diffPanel.boundingBox();
    expect(mainBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    expect((panelBox?.x ?? 0)).toBeGreaterThan((mainBox?.x ?? 0) + (mainBox?.width ?? 0) / 2);
    expect(Math.abs((panelBox?.y ?? 0) - (mainBox?.y ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((panelBox?.height ?? 0) - (mainBox?.height ?? 0))).toBeLessThanOrEqual(1);

    await window.evaluate(() => {
      document.documentElement.classList.remove("dark");
    });
    const lightPanelBackground = await diffPanel.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(lightPanelBackground).toBe("rgb(255, 255, 255)");

    const resizeHandle = diffPanel.getByLabel("Resize Changes panel");
    const handleBox = await resizeHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    if (!handleBox || !panelBox) {
      throw new Error("Expected Changes resize handle and panel boxes");
    }
    await window.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 40);
    await window.mouse.down();
    await window.mouse.move(handleBox.x - 120, handleBox.y + 40, { steps: 5 });
    await window.mouse.up();
    await expect
      .poll(async () => (await diffPanel.boundingBox())?.width ?? 0)
      .toBeGreaterThan(panelBox.width + 80);

    await window.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    const darkPanelBackground = await diffPanel.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(darkPanelBackground).not.toBe(lightPanelBackground);
    await window.getByLabel("Toggle Changes").hover();
    await expect.poll(() => contrastRatioFor(changesTooltip)).toBeGreaterThanOrEqual(4.5);

    await diffPanel.locator(".diff-panel__file-name").click();
    await expect(diffPanel.getByRole("button", { name: "Preview" })).toHaveAttribute("aria-pressed", "true");
    await expect(diffPanel.getByTestId("diff-panel-markdown-preview").locator("h1")).toHaveText("diff-workspace");
    await diffPanel.getByRole("button", { name: "Raw" }).click();
    await expect(diffPanel.getByTestId("diff-panel-markdown-raw")).toContainText("new line");

    await window.keyboard.press(desktopShortcut("D"));
    await expect(diffPanel).toHaveCount(0);
  } finally {
    await harness.close();
  }
});

async function contrastRatioFor(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const parseColor = (value: string) => {
      const parts = value.match(/[\d.]+/g)?.map(Number);
      if (!parts || parts.length < 3) {
        return null;
      }
      return {
        r: parts[0] ?? 0,
        g: parts[1] ?? 0,
        b: parts[2] ?? 0,
      };
    };
    const relativeLuminance = (color: { r: number; g: number; b: number }) =>
      [color.r, color.g, color.b]
        .map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);

    const style = getComputedStyle(element);
    const foreground = parseColor(style.color);
    const background = parseColor(style.backgroundColor);
    if (!foreground || !background) {
      return 0;
    }
    const foregroundLuminance = relativeLuminance(foreground);
    const backgroundLuminance = relativeLuminance(background);
    const lighter = Math.max(foregroundLuminance, backgroundLuminance);
    const darker = Math.min(foregroundLuminance, backgroundLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  });
}
