import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  generatePlanningProjections,
  GENERATED_PROJECTION_MARKER,
  GENERATED_PROJECTION_SOURCE,
  hasGeneratedProjectionHeader,
  type GeneratePlanningProjectionsInput,
  type ProjectionFile,
} from "./projections.js";
import type { PlanSnapshot, WorkflowPreferencesRecord } from "./types.js";

export interface WriteProjectionFilesInput {
  readonly workspaceRoot: string;
  readonly files: readonly ProjectionFile[];
  readonly allowLegacyOverwrite?: boolean;
}

export interface RegenerateProjectionsInput {
  readonly workspaceRoot: string;
  readonly projectionInput: GeneratePlanningProjectionsInput;
  readonly allowLegacyOverwrite?: boolean;
}

export interface WriteWorkflowPreferenceFilesInput {
  readonly workspaceRoot: string;
  readonly plan: PlanSnapshot;
}

export type ProjectionWriteStatus = "written" | "skipped";

export interface ProjectionWriteEntry {
  readonly path: string;
  readonly status: ProjectionWriteStatus;
}

export interface ProjectionWriteConflict {
  readonly path: string;
  readonly reason: "legacy-file";
}

export interface ProjectionWriteResult {
  readonly written: readonly ProjectionWriteEntry[];
  readonly skipped: readonly ProjectionWriteEntry[];
  readonly conflicts: readonly ProjectionWriteConflict[];
}

export class ProjectionWriteConflictError extends Error {
  readonly code = "PROJECTION_WRITE_CONFLICT";
  readonly conflicts: readonly ProjectionWriteConflict[];

  constructor(conflicts: readonly ProjectionWriteConflict[]) {
    super(`Projection write blocked by ${conflicts.length} legacy file conflict${conflicts.length === 1 ? "" : "s"}`);
    this.name = "ProjectionWriteConflictError";
    this.conflicts = conflicts;
  }
}

export async function regenerateProjections(input: RegenerateProjectionsInput): Promise<ProjectionWriteResult> {
  return await writeProjectionFiles({
    workspaceRoot: input.workspaceRoot,
    files: generatePlanningProjections(input.projectionInput),
    allowLegacyOverwrite: input.allowLegacyOverwrite,
  });
}

export async function writeWorkflowPreferenceFiles(input: WriteWorkflowPreferenceFilesInput): Promise<void> {
  const preferences = input.plan.workflowPreferences;
  if (!preferences) {
    throw new Error("Workflow preferences are required before writing preference projections");
  }

  const workspaceRoot = resolve(input.workspaceRoot);
  await atomicWriteFile(
    resolveProjectionPath(workspaceRoot, ".gsd/PREFERENCES.md"),
    renderWorkflowPreferencesFile(input.plan, preferences),
  );
  await atomicWriteFile(
    resolveProjectionPath(workspaceRoot, ".gsd/runtime/research-decision.json"),
    renderResearchDecisionFile(preferences),
  );
}

export async function writeProjectionFiles(input: WriteProjectionFilesInput): Promise<ProjectionWriteResult> {
  const workspaceRoot = resolve(input.workspaceRoot);
  const writePlan = await Promise.all(
    input.files.map(async (file) => {
      const targetPath = resolveProjectionPath(workspaceRoot, file.path);
      const existing = await readExisting(targetPath);
      return { file, targetPath, existing };
    }),
  );

  const conflicts = writePlan
    .filter((entry) => entry.existing !== undefined && !hasGeneratedProjectionHeader(entry.existing))
    .map((entry): ProjectionWriteConflict => ({ path: entry.file.path, reason: "legacy-file" }));

  if (conflicts.length > 0 && input.allowLegacyOverwrite !== true) {
    throw new ProjectionWriteConflictError(conflicts);
  }

  const written: ProjectionWriteEntry[] = [];
  const skipped: ProjectionWriteEntry[] = [];

  for (const entry of writePlan) {
    if (entry.existing === entry.file.content) {
      skipped.push({ path: entry.file.path, status: "skipped" });
      continue;
    }

    await atomicWriteFile(entry.targetPath, entry.file.content);
    written.push({ path: entry.file.path, status: "written" });
  }

  await removeStaleGeneratedProjectionFiles(
    workspaceRoot,
    new Set(writePlan.map((entry) => entry.targetPath)),
  );

  return { written, skipped, conflicts };
}

function resolveProjectionPath(workspaceRoot: string, relativePath: string): string {
  const targetPath = resolve(workspaceRoot, relativePath);
  const rootWithSeparator = workspaceRoot.endsWith("/") ? workspaceRoot : `${workspaceRoot}/`;
  if (targetPath !== workspaceRoot && !targetPath.startsWith(rootWithSeparator)) {
    throw new Error(`Projection path escapes workspace root: ${relativePath}`);
  }
  return targetPath;
}

async function readExisting(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }
    throw error;
  }
}

async function atomicWriteFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmpPath = join(dirname(path), `.${process.pid}.${randomUUID()}.${path.split("/").at(-1) ?? "projection"}.tmp`);
  await writeFile(tmpPath, content, "utf8");

  try {
    await rename(tmpPath, path);
  } catch (error) {
    await cleanupTempFile(tmpPath);
    throw error;
  }
}

async function cleanupTempFile(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }
}

async function removeStaleGeneratedProjectionFiles(
  workspaceRoot: string,
  activeProjectionPaths: ReadonlySet<string>,
): Promise<void> {
  const projectionRoot = resolveProjectionPath(workspaceRoot, ".gsd");
  const generatedFiles = await listGeneratedProjectionFiles(projectionRoot);
  await Promise.all(
    generatedFiles
      .filter((path) => !activeProjectionPaths.has(path))
      .map((path) => unlink(path)),
  );
}

async function listGeneratedProjectionFiles(directory: string): Promise<readonly string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isMissingFileError(error)) {
      return [];
    }
    throw error;
  }

  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listGeneratedProjectionFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const content = await readExisting(path);
      if (content !== undefined && hasGeneratedProjectionHeader(content)) {
        files.push(path);
      }
    }
  }
  return files;
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function renderWorkflowPreferencesFile(plan: PlanSnapshot, preferences: WorkflowPreferencesRecord): string {
  return [
    "---",
    `commit_policy: ${preferences.commitPolicy}`,
    `branch_model: ${preferences.branchModel}`,
    `uat_dispatch: ${preferences.uatDispatch ? "true" : "false"}`,
    `research: ${preferences.research}`,
    `workflow_prefs_captured: ${preferences.workflowPrefsCaptured ? "true" : "false"}`,
    "models:",
    `  executor_class: ${preferences.models.executorClass}`,
    "---",
    "",
    `<!-- ${GENERATED_PROJECTION_MARKER}`,
    `source: ${GENERATED_PROJECTION_SOURCE}`,
    `plan-id: ${plan.id}`,
    `plan-readable-id: ${plan.readableId}`,
    `plan-revision: ${plan.revision}`,
    `captured-at: ${preferences.capturedAt}`,
    "do-not-edit: true",
    "-->",
    "",
    "# Workflow Preferences",
    "",
    "Recommended workflow defaults captured by Plan Builder.",
  ].join("\n").concat("\n");
}

function renderResearchDecisionFile(preferences: WorkflowPreferencesRecord): string {
  return JSON.stringify(
    {
      decision: preferences.research,
      decided_at: preferences.capturedAt,
      source: "workflow-preferences",
      reason: "deterministic-default",
    },
    null,
    2,
  ).concat("\n");
}
