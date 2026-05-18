import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { discoverLegacyMarkdownReferences } from "../dist/index.js";

test("discovers hand-written GSD Markdown and skips generated projections", async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "gsd-legacy-references-"));

  try {
    await mkdir(join(workspaceRoot, ".gsd", "notes"), { recursive: true });
    await writeFile(
      join(workspaceRoot, ".gsd", "notes", "legacy-plan.md"),
      "# Legacy Plan\n\nUse the existing rollout notes as planning context.\n",
      "utf8",
    );
    await writeFile(
      join(workspaceRoot, ".gsd", "PROJECT.md"),
      "<!-- pi-gui-plan-builder-generated\nsource: .gsd/gsd.db\n-->\n\n# Project\n",
      "utf8",
    );

    const references = await discoverLegacyMarkdownReferences({ workspaceRoot });

    assert.equal(references.length, 1);
    assert.equal(references[0]?.path, ".gsd/notes/legacy-plan.md");
    assert.equal(references[0]?.title, "Legacy Plan");
    assert.equal(references[0]?.excerpt, "Use the existing rollout notes as planning context.");
    assert.match(references[0]?.contentHash ?? "", /^[a-f0-9]{64}$/);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});
