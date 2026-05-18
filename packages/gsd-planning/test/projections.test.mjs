import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  compareProjectionFiles,
  generatePlanningProjections,
  openPlanningStore,
  ProjectionWriteConflictError,
  regenerateProjections,
  writeWorkflowPreferenceFiles,
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
        ".gsd/NEXT.md",
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

    const requirements = files.find((file) => file.path === ".gsd/REQUIREMENTS.md")?.content ?? "";
    assert.match(requirements, /### R001: Persist every answer/);
    assert.match(requirements, /## Plan Coverage/);
    assert.match(requirements, /\| R001 \| active \| covered \| M001\/S01\/T01 \|/);
    assert.match(requirements, /\| R002 \| active \| uncovered \| _None_ \|/);
    assert.match(requirements, /\| R003 \| deferred \| deferred \| _None_ \|/);
    assert.match(files.find((file) => file.path === ".gsd/PROJECT.md")?.content ?? "", /## Phase Sequence/);
    assert.match(files.find((file) => file.path === ".gsd/PROJECT.md")?.content ?? "", /P01: Foundation/);
    const nextWork = files.find((file) => file.path === ".gsd/NEXT.md")?.content ?? "";
    assert.match(nextWork, /# Next Work/);
    assert.match(nextWork, /\*\*Queue:\*\* 1 ready \/ 0 blocked/);
    assert.match(nextWork, /## Autonomous Run Policy/);
    assert.match(nextWork, /Mode: supervised/);
    assert.match(nextWork, /Stop conditions: tests-fail, scope-ambiguous, destructive-action, dirty-conflict, milestone-complete/);
    assert.match(nextWork, /Guardrail tests-fail: Tests fail - Stop when a required typecheck, build, test, lint, or verification command fails/);
    assert.match(nextWork, /Guardrail dirty-conflict: Dirty worktree conflict - Stop when unrelated local changes overlap/);
    assert.match(nextWork, /## Model Routing/);
    assert.match(nextWork, /Execute: not configured in project - resolve from global or session default at runtime/);
    assert.match(files.find((file) => file.path.endsWith("M001-ROADMAP.md"))?.content ?? "", /## Boundary Map/);
    assert.match(files.find((file) => file.path.endsWith("M001-ROADMAP.md"))?.content ?? "", /\*\*Phase:\*\* P01 - Foundation/);
    assert.match(files.find((file) => file.path.endsWith("M001-ROADMAP.md"))?.content ?? "", /`reqs:\[R001\]`/);
    assert.match(files.find((file) => file.path.endsWith("T01-PLAN.md"))?.content ?? "", /### Key Links/);
    assert.match(files.find((file) => file.path.endsWith("T01-PLAN.md"))?.content ?? "", /\*\*Requirements:\*\* R001/);

    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("projects the next work queue with blockers and evidence gaps", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    const store = openPlanningStore({ workspaceRoot, updateGitignore: false });
    let snapshot = seedSnapshot(store);
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "task.status-updated",
        task: {
          taskId: "T01",
          taskPath: "M001/S01/T01",
          status: "done",
          note: "Package scaffold is complete.",
          blocker: "",
        },
      },
    });
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "run.recovery-updated",
        summary: {
          lastAttemptedTask: {
            taskId: "T01",
            taskPath: "M001/S01/T01",
            title: "Package scaffold",
          },
          stopReason: "task-completed",
          stopDetail: "Task completed without evidence.",
          resumeTarget: {
            taskId: "T02",
            taskPath: "M001/S01/T02",
            title: "Second generated task",
          },
        },
      },
    });

    const files = generatePlanningProjections(makeProjectionInput(snapshot, { includeSecondTask: true }));
    const nextWork = files.find((file) => file.path === ".gsd/NEXT.md")?.content ?? "";

    assert.match(nextWork, /\*\*Active Plan:\*\* .+ - Plan Builder/);
    assert.match(nextWork, /\*\*Queue:\*\* 0 ready \/ 1 blocked/);
    assert.match(nextWork, /## Recovery Summary/);
    assert.match(nextWork, /Last attempted task: M001\/S01\/T01: Package scaffold/);
    assert.match(nextWork, /Stop reason: Task completed/);
    assert.match(nextWork, /Resume target: M001\/S01\/T02: Second generated task/);
    assert.match(nextWork, /### M001\/S01\/T02: Second generated task/);
    assert.match(nextWork, /M001\/S01\/T01: Dependency is not done with evidence/);
    assert.match(nextWork, /M001\/S01\/T01: done without evidence/);
    assert.match(nextWork, /A dependency unblocks only after it is done with evidence or has passed verification/);

    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("projects a verification evidence ledger with source sessions", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    const store = openPlanningStore({ workspaceRoot, updateGitignore: false });
    let snapshot = seedSnapshot(store);
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "task.session-linked",
        link: {
          taskId: "T01",
          taskPath: "M001/S01/T01",
          workspaceId: "workspace-1",
          sessionId: "session-1",
          title: "Task T01 - Package scaffold",
        },
      },
    });
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "task.status-updated",
        task: {
          taskId: "T01",
          taskPath: "M001/S01/T01",
          status: "done",
          note: "Package scaffold is complete.",
          blocker: "",
        },
      },
    });
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "task.evidence-recorded",
        evidence: {
          taskId: "T01",
          taskPath: "M001/S01/T01",
          text: "Scaffold evidence recorded.",
          sourceSessionId: "session-1",
          sourceSessionTitle: "Task T01 - Package scaffold",
        },
      },
    });
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "task.verification-recorded",
        verification: {
          taskId: "T01",
          taskPath: "M001/S01/T01",
          acceptance: "Package scaffold",
          status: "passed",
          note: "Evidence matched acceptance.",
        },
      },
    });

    const files = generatePlanningProjections(makeProjectionInput(snapshot));
    const nextWork = files.find((file) => file.path === ".gsd/NEXT.md")?.content ?? "";

    assert.match(nextWork, /## Verification Evidence Ledger/);
    assert.match(nextWork, /\| M001\/S01\/T01 \| done \| Scaffold evidence recorded\. \| Task T01 - Package scaffold \| passed - Evidence matched acceptance\. \|/);

    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("projects change proposal activity into the state change log", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    const store = openPlanningStore({ workspaceRoot, updateGitignore: false });
    let snapshot = seedSnapshot(store);
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "change.proposal-drafted",
        proposal: {
          id: "proposal-add-task",
          sourceType: "parked-item",
          sourceParkedItemId: "idea-1",
          title: "Add audit task",
          summary: "Add an audit task after verification.",
          impactNotes: "Execution needs a new task.",
        },
      },
    });
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "change.proposal-approved",
        proposalId: "proposal-add-task",
        injection: {
          changeProposalId: "proposal-add-task",
          sourceParkedItemId: "idea-1",
          acceptedOutputId: "roadmap-output-1",
          targetMilestoneId: "M001",
          targetSliceId: "S01",
          taskId: "T02",
          taskPath: "M001/S01/T02",
          title: "Run audit",
          acceptance: "Audit task is represented.",
          dependencies: ["T01"],
        },
      },
    });
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "plan.item-hidden",
        item: {
          id: "hidden-task-1",
          targetType: "task",
          targetId: "T02",
          targetPath: "M001/S01/T02",
          reason: "No longer needed.",
          acceptedOutputId: "roadmap-output-2",
        },
      },
    });
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "plan.item-restored",
        itemId: "hidden-task-1",
        targetPath: "M001/S01/T02",
        acceptedOutputId: "roadmap-output-3",
      },
    });
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "change.proposal-drafted",
        proposal: {
          id: "proposal-withdrawn",
          sourceType: "parked-item",
          sourceParkedItemId: "idea-2",
          title: "Drop banner",
          summary: "Drop a banner before approval.",
          impactNotes: "No active plan impact.",
        },
      },
    });
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "change.proposal-withdrawn",
        proposalId: "proposal-withdrawn",
      },
    });

    const files = generatePlanningProjections(makeProjectionInput(snapshot));
    const state = files.find((file) => file.path === ".gsd/STATE.md")?.content ?? "";

    assert.match(state, /## Change Log/);
    assert.match(state, /### Add audit task/);
    assert.match(state, /- \*\*Status:\*\* Approved/);
    assert.match(state, /- \*\*Injected task:\*\* M001\/S01\/T02/);
    assert.match(state, /  - Drafted: Drafted proposal/);
    assert.match(state, /  - Approved: Approved as new task M001\/S01\/T02/);
    assert.match(state, /  - Hidden: Hidden injected task M001\/S01\/T02/);
    assert.match(state, /  - Restored: Restored injected task M001\/S01\/T02/);
    assert.match(state, /### Drop banner/);
    assert.match(state, /- \*\*Status:\*\* Deleted/);
    assert.match(state, /  - Deleted: Deleted draft/);
    assert.doesNotMatch(state, /change\.proposal/);
    assert.doesNotMatch(state, /plan\.item/);

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

test("writes workflow preference projections and runtime research decision", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    const store = openPlanningStore({ workspaceRoot, updateGitignore: false });
    let snapshot = seedSnapshot(store);
    snapshot = store.appendEvent({
      planId: snapshot.id,
      expectedRevision: snapshot.revision,
      event: {
        type: "workflow.preferences-updated",
        preferences: {
          commitPolicy: "per-task",
          branchModel: "single",
          uatDispatch: true,
          research: "skip",
          workflowPrefsCaptured: true,
          models: {
            executorClass: "balanced",
            phaseOverrides: {
              execute: {
                providerId: "openai",
                modelId: "gpt-5",
              },
              verify: {
                providerId: "openai",
                modelId: "gpt-4o",
              },
            },
          },
        },
      },
    });

    await writeWorkflowPreferenceFiles({ workspaceRoot, plan: snapshot });

    const nextWorkWithPrefs =
      generatePlanningProjections(makeProjectionInput(snapshot)).find((file) => file.path === ".gsd/NEXT.md")?.content ?? "";
    assert.match(nextWorkWithPrefs, /Execute: project override - openai\/gpt-5/);
    assert.match(nextWorkWithPrefs, /Verify: project override - openai\/gpt-4o/);

    const preferences = await readFile(join(workspaceRoot, ".gsd/PREFERENCES.md"), "utf8");
    assert.match(preferences, /^---\ncommit_policy: per-task\nbranch_model: single\nuat_dispatch: true\nresearch: skip\n/);
    assert.match(preferences, /workflow_prefs_captured: true/);
    assert.match(preferences, /autonomous_run:\n  mode: supervised\n  commit_cadence: per-task\n  verification_required: true/);
    assert.match(preferences, /stop_conditions:\n    - tests-fail\n    - scope-ambiguous\n    - destructive-action\n    - dirty-conflict\n    - milestone-complete/);
    assert.match(preferences, /guardrails:\n    - condition: tests-fail\n      action: stop-and-report\n      label: Tests fail/);
    assert.match(preferences, /condition: dirty-conflict\n      action: stop-and-report\n      label: Dirty worktree conflict/);
    assert.match(preferences, /models:\n  executor_class: balanced/);
    assert.match(preferences, /phase_overrides:\n    execute:\n      provider: openai\n      model: gpt-5/);
    assert.match(preferences, /verify:\n      provider: openai\n      model: gpt-4o/);
    assert.match(preferences, /## Autonomous Run Policy/);
    assert.match(preferences, /- Stop conditions: tests-fail, scope-ambiguous, destructive-action, dirty-conflict, milestone-complete/);
    assert.match(preferences, /  - destructive-action: Destructive action needed - Stop before deleting user data/);
    assert.match(preferences, /pi-gui-plan-builder-generated/);

    const decision = JSON.parse(await readFile(join(workspaceRoot, ".gsd/runtime/research-decision.json"), "utf8"));
    assert.equal(decision.decision, "skip");
    assert.equal(decision.source, "workflow-preferences");
    assert.equal(decision.reason, "deterministic-default");

    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("detects missing, stale, and legacy projection drift", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    const store = openPlanningStore({ workspaceRoot, updateGitignore: false });
    const snapshot = seedSnapshot(store);
    const files = generatePlanningProjections(makeProjectionInput(snapshot));
    await writeProjectionFiles({ workspaceRoot, files });

    await rm(join(workspaceRoot, ".gsd/NEXT.md"), { force: true });
    const project = await readFile(join(workspaceRoot, ".gsd/PROJECT.md"), "utf8");
    await writeFile(
      join(workspaceRoot, ".gsd/PROJECT.md"),
      project.replace("# Project: Database-backed Plan Builder", "# Project: Stale"),
      "utf8",
    );
    await writeFile(join(workspaceRoot, ".gsd/REQUIREMENTS.md"), "# Legacy requirements\n", "utf8");

    const drift = await compareProjectionFiles({ workspaceRoot, files });

    assert.deepEqual(drift.missing.map((entry) => entry.path), [".gsd/NEXT.md"]);
    assert.deepEqual(drift.stale.map((entry) => entry.path), [".gsd/PROJECT.md"]);
    assert.deepEqual(drift.conflicts.map((entry) => entry.path), [".gsd/REQUIREMENTS.md"]);
    assert.equal(drift.current.length, files.length - 3);

    await assert.rejects(
      () => writeProjectionFiles({ workspaceRoot, files }),
      (error) => error instanceof ProjectionWriteConflictError
        && error.conflicts.some((conflict) => conflict.path === ".gsd/REQUIREMENTS.md"),
    );

    const repaired = await writeProjectionFiles({ workspaceRoot, files, allowLegacyOverwrite: true });
    assert.equal(repaired.conflicts.length, 1);
    assert.equal(repaired.written.some((entry) => entry.path === ".gsd/NEXT.md"), true);
    assert.equal(repaired.written.some((entry) => entry.path === ".gsd/PROJECT.md"), true);
    assert.equal(repaired.written.some((entry) => entry.path === ".gsd/REQUIREMENTS.md"), true);

    store.close();
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("removes stale generated projection files that are no longer projected", async () => {
  const workspaceRoot = await makeWorkspace();

  try {
    const store = openPlanningStore({ workspaceRoot, updateGitignore: false });
    const snapshot = seedSnapshot(store);
    const initialInput = makeProjectionInput(snapshot, { includeSecondTask: true });
    await writeProjectionFiles({
      workspaceRoot,
      files: generatePlanningProjections(initialInput),
    });

    const staleTaskPath = join(workspaceRoot, ".gsd/milestones/M001/slices/S01/tasks/T02-PLAN.md");
    assert.match(await readFile(staleTaskPath, "utf8"), /Second generated task/);

    await regenerateProjections({
      workspaceRoot,
      projectionInput: makeProjectionInput(snapshot),
    });

    await assert.rejects(
      () => readFile(staleTaskPath, "utf8"),
      (error) => isMissingFileError(error),
    );
    const activeTask = await readFile(join(workspaceRoot, ".gsd/milestones/M001/slices/S01/tasks/T01-PLAN.md"), "utf8");
    assert.match(activeTask, /Package scaffold/);

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
  snapshot = store.appendEvent({
    planId: snapshot.id,
    expectedRevision: snapshot.revision,
    event: {
      type: "requirement.upserted",
      requirement: {
        id: "R002",
        title: "Review generated coverage",
        class: "quality",
        status: "active",
        description: "Generated Markdown makes uncovered active requirements obvious.",
        why: "Coverage should be reviewable without opening the database.",
        source: "user",
        owner: "M001/S01",
        validationStatus: "missing",
      },
    },
  });
  snapshot = store.appendEvent({
    planId: snapshot.id,
    expectedRevision: snapshot.revision,
    event: {
      type: "requirement.upserted",
      requirement: {
        id: "R003",
        title: "Deferred integration",
        class: "integration",
        status: "deferred",
        description: "A later integration can wait until the next milestone.",
        why: "The current milestone can ship without it.",
        source: "user",
        owner: "M002",
        validationStatus: "partial",
      },
    },
  });
  return snapshot;
}

function makeProjectionInput(snapshot, options = {}) {
  const tasks = [
    {
      id: "T01",
      title: "Package scaffold",
      status: "done",
      requirementIds: ["R001"],
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
  ];
  if (options.includeSecondTask) {
    tasks.push({
      id: "T02",
      title: "Second generated task",
      status: "pending",
      dependencies: ["T01"],
      requirementIds: [],
      description: "Create a removable generated task.",
      goal: "Prove stale generated files are removed.",
      mustHaves: {
        truths: ["Stale files disappear."],
        artifacts: [".gsd/milestones/M001/slices/S01/tasks/T02-PLAN.md"],
        keyLinks: ["projection-writer.ts"],
      },
      steps: ["Generate task.", "Remove task."],
      context: ["Only generated projection files can be removed."],
    });
  }

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
    phases: [
      {
        id: "P01",
        title: "Foundation",
        goal: "Build the planning engine foundation.",
        status: "active",
      },
    ],
    milestones: [
      {
        id: "M001",
        title: "Database-Backed Plan Builder",
        phaseId: "P01",
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
            tasks,
          },
        ],
      },
    ],
  };
}

async function makeWorkspace() {
  return await mkdtemp(join(tmpdir(), "pi-gsd-projections-"));
}

function isMissingFileError(error) {
  return typeof error === "object" && error !== null && error.code === "ENOENT";
}
