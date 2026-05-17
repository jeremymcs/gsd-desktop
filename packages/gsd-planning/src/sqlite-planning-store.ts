import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type {
  AnswerRecord,
  AppendPlanEventInput,
  ApprovedPlanInjectionRecord,
  ApprovedPlanModificationRecord,
  ChangeProposalRecord,
  CreatePlanInput,
  GeneratedOutputRecord,
  HiddenPlanItemRecord,
  ParkedItemRecord,
  PersistedPlanEvent,
  PlanEvent,
  PlanId,
  PlanListEntry,
  PlanningStore,
  PlanPhase,
  PlanSnapshot,
  PlanStage,
  PlanStatus,
  ProjectSummary,
  RequirementRecord,
  ShipSummaryRecord,
  StageStateRecord,
  StageStatus,
  TaskEvidenceRecord,
  TaskExecutionRecord,
  TaskSessionLinkRecord,
  TaskVerificationRecord,
  WorkflowPhaseModelPreferences,
  WorkflowPreferencesRecord,
} from "./types.js";

const SCHEMA_VERSION = 1;
const DATABASE_RELATIVE_PATH = ".gsd/gsd.db";
const GITIGNORE_ENTRY = ".gsd/gsd.db";
const PLAN_PHASES: readonly PlanPhase[] = ["discuss", "research", "plan", "execute", "verify", "ship"];

export interface OpenPlanningStoreOptions {
  readonly workspaceRoot: string;
  readonly updateGitignore?: boolean;
}

export class PlanningRevisionConflictError extends Error {
  readonly code = "PLANNING_REVISION_CONFLICT";
  readonly planId: PlanId;
  readonly expectedRevision: number;
  readonly actualRevision: number;

  constructor(planId: PlanId, expectedRevision: number, actualRevision: number) {
    super(`Planning revision conflict for ${planId}: expected ${expectedRevision}, found ${actualRevision}`);
    this.name = "PlanningRevisionConflictError";
    this.planId = planId;
    this.expectedRevision = expectedRevision;
    this.actualRevision = actualRevision;
  }
}

export class SqlitePlanningStore implements PlanningStore {
  private readonly db: Database.Database;

  constructor(private readonly databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.db = new Database(databasePath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.migrate();
  }

  createPlan(input: CreatePlanInput): PlanSnapshot {
    const now = new Date().toISOString();
    const planId = randomUUID();
    const readableId = input.readableId ?? this.nextReadablePlanId();
    const activePhase = input.initialPhase ?? "discuss";
    const activeStage = input.initialStage ?? "project";
    const name = normalizeName(input.name);

    this.db.prepare(`
      INSERT INTO plans (
        id,
        readable_id,
        name,
        status,
        active_phase,
        active_stage,
        current_revision,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(planId, readableId, name, "draft", activePhase, activeStage, now, now);

    const snapshot = this.getPlanSnapshot(planId);
    if (!snapshot) {
      throw new Error(`Created plan could not be loaded: ${planId}`);
    }
    return snapshot;
  }

  listPlans(): readonly PlanListEntry[] {
    return this.db.prepare(`
      SELECT
        id,
        readable_id AS readableId,
        name,
        status,
        active_phase AS activePhase,
        active_stage AS activeStage,
        current_revision AS revision,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM plans
      ORDER BY created_at ASC, readable_id ASC
    `).all().map(toPlanListEntry);
  }

  getPlanSnapshot(planId: PlanId): PlanSnapshot | undefined {
    const plan = this.db.prepare(`
      SELECT
        id,
        readable_id AS readableId,
        name,
        status,
        active_phase AS activePhase,
        active_stage AS activeStage,
        current_revision AS revision,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM plans
      WHERE id = ?
    `).get(planId);

    if (!plan) {
      return undefined;
    }

    const events = this.db.prepare(`
      SELECT
        id,
        plan_id AS planId,
        revision,
        type,
        payload_json AS payloadJson,
        created_at AS createdAt
      FROM plan_events
      WHERE plan_id = ?
      ORDER BY revision ASC
    `).all(planId).map(toPersistedPlanEvent);

    return replaySnapshot(toPlanListEntry(plan), events);
  }

  appendEvent(input: AppendPlanEventInput): PlanSnapshot {
    const append = this.db.transaction(() => {
      const current = this.db.prepare(`
        SELECT current_revision AS revision
        FROM plans
        WHERE id = ?
      `).get(input.planId) as RevisionRow | undefined;

      if (!current) {
        throw new Error(`Unknown plan: ${input.planId}`);
      }

      if (current.revision !== input.expectedRevision) {
        throw new PlanningRevisionConflictError(input.planId, input.expectedRevision, current.revision);
      }

      const now = new Date().toISOString();
      const nextRevision = input.expectedRevision + 1;
      const eventId = randomUUID();
      const payloadJson = JSON.stringify(input.event);

      this.db.prepare(`
        INSERT INTO plan_events (id, plan_id, revision, type, payload_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(eventId, input.planId, nextRevision, input.event.type, payloadJson, now);

      const phaseStage = phaseStageFromEvent(input.event);
      this.db.prepare(`
        UPDATE plans
        SET
          current_revision = ?,
          updated_at = ?,
          active_phase = COALESCE(?, active_phase),
          active_stage = COALESCE(?, active_stage)
        WHERE id = ?
      `).run(nextRevision, now, phaseStage?.phase, phaseStage?.stage, input.planId);
    });

    append();

    const snapshot = this.getPlanSnapshot(input.planId);
    if (!snapshot) {
      throw new Error(`Updated plan could not be loaded: ${input.planId}`);
    }
    return snapshot;
  }

  close(): void {
    this.db.close();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        readable_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        active_phase TEXT NOT NULL,
        active_stage TEXT NOT NULL,
        current_revision INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plan_events (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        revision INTEGER NOT NULL,
        type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(plan_id, revision)
      );

      CREATE INDEX IF NOT EXISTS plan_events_plan_revision_idx
        ON plan_events(plan_id, revision);
    `);

    this.db.prepare(`
      INSERT INTO schema_meta (key, value)
      VALUES ('schema_version', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(String(SCHEMA_VERSION));
  }

  private nextReadablePlanId(): string {
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM plans").get() as CountRow;
    return `P${String(row.count + 1).padStart(3, "0")}`;
  }
}

export function openPlanningStore(options: OpenPlanningStoreOptions): SqlitePlanningStore {
  const workspaceRoot = resolve(options.workspaceRoot);
  const databasePath = join(workspaceRoot, DATABASE_RELATIVE_PATH);
  mkdirSync(dirname(databasePath), { recursive: true });

  if (options.updateGitignore !== false) {
    ensureGitignoreEntry(workspaceRoot);
  }

  return new SqlitePlanningStore(databasePath);
}

export function planningDatabasePath(workspaceRoot: string): string {
  return join(resolve(workspaceRoot), DATABASE_RELATIVE_PATH);
}

function ensureGitignoreEntry(workspaceRoot: string): void {
  const gitignorePath = join(workspaceRoot, ".gitignore");
  const current = existsSync(gitignorePath) ? readFileSync(gitignorePath, "utf8") : "";
  const lines = current.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.includes(GITIGNORE_ENTRY)) {
    return;
  }
  const next = `${current}${current && !current.endsWith("\n") ? "\n" : ""}${GITIGNORE_ENTRY}\n`;
  writeFileSync(gitignorePath, next, "utf8");
}

function replaySnapshot(plan: PlanListEntry, events: readonly PersistedPlanEvent[]): PlanSnapshot {
  const project: MutableProjectSummary = {
    antiGoals: [],
    constraints: [],
  };
  const answers: AnswerRecord[] = [];
  const requirements = new Map<string, RequirementRecord>();
  const stages = new Map<PlanStage, MutableStageStateRecord>();
  const generatedOutputs = new Map<string, GeneratedOutputRecord>();
  const taskSessionLinks = new Map<string, TaskSessionLinkRecord>();
  const taskExecutions = new Map<string, MutableTaskExecutionRecord>();
  const taskVerifications = new Map<string, TaskVerificationRecord>();
  const shipSummaries: ShipSummaryRecord[] = [];
  let workflowPreferences: WorkflowPreferencesRecord | undefined;
  const parkedItems = new Map<string, ParkedItemRecord>();
  const changeProposals = new Map<string, ChangeProposalRecord>();
  const approvedInjections = new Map<string, ApprovedPlanInjectionRecord>();
  const approvedModifications = new Map<string, ApprovedPlanModificationRecord>();
  const hiddenPlanItems = new Map<string, HiddenPlanItemRecord>();

  for (const event of events) {
    const payload = event.payload;
    switch (payload.type) {
      case "phase.updated":
        break;
      case "project.updated":
        Object.assign(project, payload.project);
        project.antiGoals = payload.project.antiGoals ?? project.antiGoals;
        project.constraints = payload.project.constraints ?? project.constraints;
        break;
      case "stage.updated": {
        const current = ensureStage(stages, payload.stage);
        if (payload.status) {
          current.status = payload.status;
        }
        if (payload.activeQuestionId !== undefined) {
          current.activeQuestionId = payload.activeQuestionId;
        }
        break;
      }
      case "stage.depth-confirmed": {
        const current = ensureStage(stages, payload.stage);
        current.depthConfirmedAt = event.createdAt;
        if (current.status === "not-started") {
          current.status = "approved";
        }
        break;
      }
      case "answer.recorded": {
        answers.push({
          id: payload.answer.id ?? event.id,
          stage: payload.answer.stage,
          questionId: payload.answer.questionId,
          prompt: payload.answer.prompt,
          answer: payload.answer.answer,
          loadBearing: payload.answer.loadBearing,
          ...(payload.answer.discretionRationale
            ? { discretionRationale: payload.answer.discretionRationale }
            : {}),
          ...(payload.answer.revisedFromAnswerId
            ? { revisedFromAnswerId: payload.answer.revisedFromAnswerId }
            : {}),
          createdAt: event.createdAt,
        });
        break;
      }
      case "answer.revised": {
        const original = answers.find((answer) => answer.id === payload.answerId);
        if (original) {
          answers.push({
            ...original,
            id: event.id,
            answer: payload.answer,
            revisedFromAnswerId: original.id,
            ...(payload.rationale ? { discretionRationale: payload.rationale } : {}),
            createdAt: event.createdAt,
          });
        }
        break;
      }
      case "requirement.upserted":
        requirements.set(payload.requirement.id, payload.requirement);
        break;
      case "generated-output.proposed": {
        const now = event.createdAt;
        generatedOutputs.set(payload.output.id, {
          id: payload.output.id,
          stage: payload.output.stage,
          title: payload.output.title,
          content: payload.output.content,
          status: payload.output.status ?? "proposed",
          createdAt: now,
          updatedAt: now,
        });
        break;
      }
      case "generated-output.reviewed": {
        const current = generatedOutputs.get(payload.outputId);
        if (current) {
          generatedOutputs.set(payload.outputId, {
            ...current,
            status: payload.status,
            updatedAt: event.createdAt,
          });
        }
        break;
      }
      case "task.session-linked":
        taskSessionLinks.set(payload.link.taskId, {
          id: payload.link.id ?? event.id,
          taskId: payload.link.taskId,
          taskPath: payload.link.taskPath,
          workspaceId: payload.link.workspaceId,
          sessionId: payload.link.sessionId,
          title: payload.link.title,
          createdAt: event.createdAt,
        });
        break;
      case "task.status-updated": {
        const current = ensureTaskExecution(taskExecutions, payload.task.taskId, payload.task.taskPath, event.createdAt);
        current.taskPath = payload.task.taskPath;
        current.status = payload.task.status;
        current.note = payload.task.note;
        current.blocker = payload.task.blocker;
        current.updatedAt = event.createdAt;
        break;
      }
      case "task.evidence-recorded": {
        const current = ensureTaskExecution(
          taskExecutions,
          payload.evidence.taskId,
          payload.evidence.taskPath,
          event.createdAt,
        );
        current.taskPath = payload.evidence.taskPath;
        current.evidence = [
          ...current.evidence,
          {
            id: payload.evidence.id ?? event.id,
            taskId: payload.evidence.taskId,
            taskPath: payload.evidence.taskPath,
            text: payload.evidence.text,
            createdAt: event.createdAt,
          },
        ];
        current.updatedAt = event.createdAt;
        break;
      }
      case "task.verification-recorded":
        taskVerifications.set(payload.verification.taskId, {
          id: payload.verification.id ?? event.id,
          taskId: payload.verification.taskId,
          taskPath: payload.verification.taskPath,
          acceptance: payload.verification.acceptance,
          status: payload.verification.status,
          note: payload.verification.note,
          createdAt: event.createdAt,
        });
        break;
      case "ship.summary-recorded":
        shipSummaries.push({
          id: payload.summary.id ?? event.id,
          summary: payload.summary.summary,
          createdAt: event.createdAt,
        });
        break;
      case "workflow.preferences-updated":
        workflowPreferences = {
          commitPolicy: payload.preferences.commitPolicy,
          branchModel: payload.preferences.branchModel,
          uatDispatch: payload.preferences.uatDispatch,
          research: payload.preferences.research,
          models: {
            executorClass: payload.preferences.models.executorClass,
            phaseOverrides: normalizeWorkflowPhaseModels(payload.preferences.models.phaseOverrides),
          },
          workflowPrefsCaptured: payload.preferences.workflowPrefsCaptured,
          capturedAt: payload.preferences.capturedAt ?? event.createdAt,
        };
        break;
      case "idea.parked":
        parkedItems.set(payload.item.id ?? event.id, {
          id: payload.item.id ?? event.id,
          sourceType: payload.item.sourceType,
          ...(payload.item.sourceAnswerId ? { sourceAnswerId: payload.item.sourceAnswerId } : {}),
          sourceStage: payload.item.sourceStage,
          sourceQuestionId: payload.item.sourceQuestionId,
          sourcePrompt: payload.item.sourcePrompt,
          text: payload.item.text,
          rationale: payload.item.rationale,
          reviewStatus: "parked",
          createdAt: event.createdAt,
        });
        break;
      case "idea.reviewed": {
        const current = parkedItems.get(payload.itemId);
        if (current) {
          parkedItems.set(payload.itemId, {
            ...current,
            reviewStatus: payload.status,
            ...(payload.note ? { reviewNote: payload.note } : {}),
            reviewedAt: event.createdAt,
          });
        }
        break;
      }
      case "change.proposal-drafted": {
        const now = event.createdAt;
        changeProposals.set(payload.proposal.id ?? event.id, {
          id: payload.proposal.id ?? event.id,
          sourceType: payload.proposal.sourceType,
          sourceParkedItemId: payload.proposal.sourceParkedItemId,
          title: payload.proposal.title,
          summary: payload.proposal.summary,
          impactNotes: payload.proposal.impactNotes,
          status: payload.proposal.status ?? "draft",
          createdAt: now,
          updatedAt: now,
        });
        break;
      }
      case "change.proposal-approved": {
        const current = changeProposals.get(payload.proposalId);
        const injectionId = payload.injection.id ?? event.id;
        const injection = {
          id: injectionId,
          changeProposalId: payload.injection.changeProposalId,
          sourceParkedItemId: payload.injection.sourceParkedItemId,
          acceptedOutputId: payload.injection.acceptedOutputId,
          targetMilestoneId: payload.injection.targetMilestoneId,
          targetSliceId: payload.injection.targetSliceId,
          taskId: payload.injection.taskId,
          taskPath: payload.injection.taskPath,
          title: payload.injection.title,
          acceptance: payload.injection.acceptance,
          dependencies: payload.injection.dependencies,
          createdAt: event.createdAt,
        };
        approvedInjections.set(injectionId, injection);
        if (current) {
          changeProposals.set(payload.proposalId, {
            ...current,
            status: "approved",
            approvedAt: event.createdAt,
            injectedTaskPath: injection.taskPath,
            acceptedOutputId: injection.acceptedOutputId,
            updatedAt: event.createdAt,
          });
        }
        break;
      }
      case "change.proposal-modification-approved": {
        const current = changeProposals.get(payload.proposalId);
        const modificationId = payload.modification.id ?? event.id;
        const modification = {
          id: modificationId,
          changeProposalId: payload.modification.changeProposalId,
          sourceParkedItemId: payload.modification.sourceParkedItemId,
          acceptedOutputId: payload.modification.acceptedOutputId,
          targetMilestoneId: payload.modification.targetMilestoneId,
          targetSliceId: payload.modification.targetSliceId,
          taskId: payload.modification.taskId,
          taskPath: payload.modification.taskPath,
          previousTitle: payload.modification.previousTitle,
          title: payload.modification.title,
          previousAcceptance: payload.modification.previousAcceptance,
          acceptance: payload.modification.acceptance,
          previousDependencies: payload.modification.previousDependencies,
          dependencies: payload.modification.dependencies,
          createdAt: event.createdAt,
        };
        approvedModifications.set(modificationId, modification);
        if (current) {
          changeProposals.set(payload.proposalId, {
            ...current,
            status: "approved",
            approvedAt: event.createdAt,
            modifiedTaskPath: modification.taskPath,
            acceptedOutputId: modification.acceptedOutputId,
            updatedAt: event.createdAt,
          });
        }
        break;
      }
      case "plan.item-hidden": {
        const itemId = payload.item.id ?? event.id;
        hiddenPlanItems.set(itemId, {
          id: itemId,
          targetType: payload.item.targetType,
          targetId: payload.item.targetId,
          targetPath: payload.item.targetPath,
          reason: payload.item.reason,
          acceptedOutputId: payload.item.acceptedOutputId,
          createdAt: event.createdAt,
        });
        break;
      }
    }
  }

  return {
    ...plan,
    project,
    requirements: [...requirements.values()].sort((left, right) => left.id.localeCompare(right.id)),
    answers,
    stages: [...stages.values()].sort((left, right) => left.stage.localeCompare(right.stage)),
    generatedOutputs: [...generatedOutputs.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    taskSessionLinks: [...taskSessionLinks.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    taskExecutions: [...taskExecutions.values()].sort((left, right) => left.taskPath.localeCompare(right.taskPath)),
    taskVerifications: [...taskVerifications.values()].sort((left, right) => left.taskPath.localeCompare(right.taskPath)),
    shipSummaries: shipSummaries.sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    ...(workflowPreferences ? { workflowPreferences } : {}),
    parkedItems: [...parkedItems.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    changeProposals: [...changeProposals.values()].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    ),
    approvedInjections: [...approvedInjections.values()].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    ),
    approvedModifications: [...approvedModifications.values()].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    ),
    hiddenPlanItems: [...hiddenPlanItems.values()].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    ),
    events,
  };
}

function ensureStage(stages: Map<PlanStage, MutableStageStateRecord>, stage: PlanStage): MutableStageStateRecord {
  const existing = stages.get(stage);
  if (existing) {
    return existing;
  }
  const created: MutableStageStateRecord = {
    stage,
    status: "not-started",
  };
  stages.set(stage, created);
  return created;
}

function ensureTaskExecution(
  taskExecutions: Map<string, MutableTaskExecutionRecord>,
  taskId: string,
  taskPath: string,
  updatedAt: string,
): MutableTaskExecutionRecord {
  const existing = taskExecutions.get(taskId);
  if (existing) {
    return existing;
  }
  const created: MutableTaskExecutionRecord = {
    taskId,
    taskPath,
    status: "not-started",
    note: "",
    blocker: "",
    evidence: [],
    updatedAt,
  };
  taskExecutions.set(taskId, created);
  return created;
}

function toPlanListEntry(value: unknown): PlanListEntry {
  const row = value as PlanRow;
  return {
    id: row.id,
    readableId: row.readableId,
    name: row.name,
    status: row.status,
    activePhase: row.activePhase,
    activeStage: row.activeStage,
    revision: row.revision,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPersistedPlanEvent(value: unknown): PersistedPlanEvent {
  const row = value as EventRow;
  const payload = JSON.parse(row.payloadJson) as PlanEvent;
  return {
    id: row.id,
    planId: row.planId,
    revision: row.revision,
    type: payload.type,
    payload,
    createdAt: row.createdAt,
  };
}

function phaseStageFromEvent(event: PlanEvent): { readonly phase: PlanPhase; readonly stage: PlanStage } | undefined {
  switch (event.type) {
    case "phase.updated":
      return { phase: event.phase, stage: event.stage };
    case "project.updated":
      return { phase: "discuss", stage: "project" };
    case "requirement.upserted":
      return { phase: "discuss", stage: "requirements" };
    case "stage.updated":
    case "stage.depth-confirmed":
      return { phase: phaseForStage(event.stage), stage: event.stage };
    case "answer.recorded":
      return { phase: phaseForStage(event.answer.stage), stage: event.answer.stage };
    case "generated-output.proposed":
      return { phase: phaseForStage(event.output.stage), stage: event.output.stage };
    case "generated-output.reviewed":
    case "answer.revised":
    case "task.session-linked":
    case "task.status-updated":
    case "task.evidence-recorded":
    case "task.verification-recorded":
    case "ship.summary-recorded":
    case "workflow.preferences-updated":
    case "idea.parked":
    case "idea.reviewed":
    case "change.proposal-drafted":
    case "change.proposal-approved":
    case "change.proposal-modification-approved":
    case "plan.item-hidden":
      return undefined;
  }
}

function phaseForStage(stage: PlanStage): PlanPhase {
  switch (stage) {
    case "project":
    case "requirements":
    case "milestone":
    case "slice-context":
      return "discuss";
    case "research":
      return "research";
    case "roadmap":
    case "task":
      return "plan";
  }
}

function normalizeName(name: string): string {
  const normalized = name.trim();
  if (!normalized) {
    throw new Error("Plan name is required");
  }
  return normalized;
}

function normalizeWorkflowPhaseModels(
  value: WorkflowPhaseModelPreferences | undefined,
): WorkflowPhaseModelPreferences {
  if (!value) {
    return {};
  }
  const normalized: WorkflowPhaseModelPreferences = {};
  for (const phase of PLAN_PHASES) {
    const preference = value[phase];
    const providerId = preference?.providerId.trim();
    const modelId = preference?.modelId.trim();
    if (providerId && modelId) {
      normalized[phase] = { providerId, modelId };
    }
  }
  return normalized;
}

interface PlanRow {
  readonly id: string;
  readonly readableId: string;
  readonly name: string;
  readonly status: PlanStatus;
  readonly activePhase: PlanPhase;
  readonly activeStage: PlanStage;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface EventRow {
  readonly id: string;
  readonly planId: string;
  readonly revision: number;
  readonly payloadJson: string;
  readonly createdAt: string;
}

interface RevisionRow {
  readonly revision: number;
}

interface CountRow {
  readonly count: number;
}

type MutableProjectSummary = {
  -readonly [Key in keyof ProjectSummary]: ProjectSummary[Key];
};

type MutableStageStateRecord = {
  -readonly [Key in keyof StageStateRecord]: StageStateRecord[Key];
};

type MutableTaskExecutionRecord = {
  -readonly [Key in keyof TaskExecutionRecord]: Key extends "evidence" ? TaskEvidenceRecord[] : TaskExecutionRecord[Key];
};
