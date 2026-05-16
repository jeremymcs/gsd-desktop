import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  generatePlanningProjections,
  openPlanningStore,
  ProjectionWriteConflictError,
  regenerateProjections,
  writeProjectionFiles,
} from "../dist/index.js";

test("renders the planning-phase projection file set with generated ownership headers", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    const store = openPlanningStore({ workspaceRoot, updateGitignore: false });
    const snapshot = seedSnapshot(store);
    const files = generatePlanningProjections(makeProjectionInput(snapshot));

    assert.deepEqual(
      files.map((file) => file.path),
      [
        ".gsd/PROJECT.md",
        ".gsd/REQUIREMENTS.md",
        ".gsd/STATE.md",
        ".gsd/DECISIONS.md",
        ".gsd/milestones/M001/M001-CONTEXT.md",
        ".gsd/milestones/M001/M001-RESEARCH.md",
        ".gsd/milestones/M001/M001-ROADMAP.md",
        ".gsd/milestones/M001/slices/S01/S01-CONTEXT.md",
        ".gsd/milestones/M001/slices/S01/S01-PLAN.md",
        ".gsd/milestones/M001/slices/S01/tasks/T01-PLAN.md",
      ],
    );

    for (const file of files) {
      assert.match(file.content, /^<!-- pi-gui-plan-builder-generated\n/);
      assert.match(file.content, /source: \.gsd\/gsd\.db/);
      assert.match(file.content, new RegExp(`plan-id: ${snapshot.id}`));
      assert.match(file.content, /do-not-edit: true/);
    }

    assert.match(files.find((file) => file.path === ".gsd/REQUIREMENTS.md")?.content ?? "", /### R001: Persist every answer/);
    assert.match(files.find((file) => file.path.endsWith("M001-ROADMAP.md"))?.content ?? "", /## Boundary Map/);
    assert.match(files.find((file) => file.path.endsWith("T01-PLAN.md"))?.content ?? "", /### Key Links/);

    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("writes projections atomically, skips unchanged files, and supports manual regeneration", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    const store = openPlanningStore({ workspaceRoot, updateGitignore: false });
    const snapshot = seedSnapshot(store);
    const projectionInput = makeProjectionInput(snapshot);
    const files = generatePlanningProjections(projectionInput);

    const firstWrite = await writeProjectionFiles({ workspaceRoot, files });
    assert.equal(firstWrite.written.length, files.length);
    assert.equal(firstWrite.skipped.length, 0);
    assert.equal(firstWrite.conflicts.length, 0);

    const secondWrite = await regenerateProjections({ workspaceRoot, projectionInput });
    assert.equal(secondWrite.written.length, 0);
    assert.equal(secondWrite.skipped.length, files.length);
    assert.equal(secondWrite.conflicts.length, 0);

    const roadmap = await readFile(join(workspaceRoot, ".gsd/milestones/M001/M001-ROADMAP.md"), "utf8");
    assert.match(roadmap, /S01: Planning Engine Foundation/);

    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("blocks legacy Markdown by default and overwrites only when explicitly allowed", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    const store = openPlanningStore({ workspaceRoot, updateGitignore: false });
    const snapshot = seedSnapshot(store);
    const files = generatePlanningProjections(makeProjectionInput(snapshot));
    await mkdir(join(workspaceRoot, ".gsd"), { recursive: true });
    await writeFile(join(workspaceRoot, ".gsd/PROJECT.md"), "# Hand-written project\n", "utf8");

    await assert.rejects(
      () => writeProjectionFiles({ workspaceRoot, files }),
      (error) => error instanceof ProjectionWriteConflictError
        && error.code === "PROJECTION_WRITE_CONFLICT"
        && error.conflicts.length === 1
        && error.conflicts[0]?.path === ".gsd/PROJECT.md",
    );

    const result = await writeProjectionFiles({ workspaceRoot, files, allowLegacyOverwrite: true });
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.written.some((entry) => entry.path === ".gsd/PROJECT.md"), true);

    const project = await readFile(join(workspaceRoot, ".gsd/PROJECT.md"), "utf8");
    assert.match(project, /^<!-- pi-gui-plan-builder-generated\n/);

    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

function seedSnapshot(store) {
  let snapshot = store.createPlan({ name: "Plan Builder" });
  snapshot = store.appendEvent({
    planId: snapshot.id,
    expectedRevision: snapshot.revision,
    event: {
      type: "project.updated",
      project: {
        title: "Database-backed Plan Builder",
        vision: "Guide users from discussion to generated plans.",
        users: "Desktop users planning new projects.",
        coreValue: "Planning state survives every turn.",
        antiGoals: ["Generic form wizard"],
        constraints: ["Database remains canonical"],
        shape: {
          complexity: "complex",
          rationale: "Spans data, UI, and generated projections.",
        },
      },
    },
  });
  snapshot = store.appendEvent({
    planId: snapshot.id,
    expectedRevision: snapshot.revision,
    event: {
      type: "requirement.upserted",
      requirement: {
        id: "R001",
        title: "Persist every answer",
        class: "operational",
        status: "active",
        description: "Every committed wizard answer is durable before generated processing starts.",
        why: "Users should not lose planning work on restart.",
        source: "user",
        owner: "M001/S01",
        validationStatus: "covered",
      },
    },
  });
  return snapshot;
}

function makeProjectionInput(snapshot) {
  return {
    plan: snapshot,
    generatedAt: "2026-05-16T00:00:00.000Z",
    state: {
      activeMilestoneId: "M001",
      activeMilestoneTitle: "Database-Backed Plan Builder",
      activeSliceId: "S02",
      activeSliceTitle: "Projection Generator and Adoption Safety",
      phase: "plan",
      recentDecisions: ["Database is canonical."],
      blockers: ["None"],
      nextAction: "Implement projection writer.",
    },
    decisions: [
      {
        id: "D001",
        when: "M001",
        scope: "data",
        decision: "Planning source of truth",
        choice: "Repo-local database",
        rationale: "Durable state with generated projections",
        revisable: "No",
      },
    ],
    milestones: [
      {
        id: "M001",
        title: "Database-Backed Plan Builder",
        vision: "Users can create a named project plan from the desktop app.",
        successCriteria: ["Projection files are generated.", "Legacy files are protected."],
        status: "active",
        contextMarkdown: "# M001: Database-Backed Plan Builder\n\n## Project Description\n\nA guided planning workbench.",
        researchMarkdown: "# M001: Research\n\nProjection safety is the main risk.",
        boundaryMap: [
          {
            title: "S01 -> S02",
            produces: ["PlanningStore -> snapshots"],
            consumes: ["S02 consumes snapshots"],
          },
        ],
        slices: [
          {
            id: "S01",
            title: "Planning Engine Foundation",
            status: "done",
            risk: "high",
            depends: [],
            demo: "Package tests prove the store.",
            goal: "Create the planning package.",
            mustHaves: ["Store opens.", "Snapshots replay."],
            filesLikelyTouched: ["packages/gsd-planning/src/index.ts"],
            contextMarkdown: "# S01: Planning Engine Foundation — Context\n\n## Goal\n\nCreate the planning package.",
            tasks: [
              {
                id: "T01",
                title: "Package scaffold",
                status: "done",
                description: "Create package metadata and types.",
                goal: "Expose a narrow package contract.",
                mustHaves: {
                  truths: ["Package builds."],
                  artifacts: ["packages/gsd-planning/package.json"],
                  keyLinks: ["index.ts -> types.ts"],
                },
                steps: ["Create package.", "Export types."],
                context: ["Follow existing package conventions."],
              },
            ],
          },
        ],
      },
    ],
  };
}

async function makeWorkspace() {
  return await mkdtemp(join(tmpdir(), "pi-gsd-projections-"));
}
