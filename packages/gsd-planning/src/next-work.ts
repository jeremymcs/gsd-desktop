import type { TaskExecutionRecord, TaskVerificationRecord } from "./types.js";

export interface NextWorkTaskInput {
  readonly taskId: string;
  readonly taskPath: string;
  readonly title: string;
  readonly dependencies: readonly string[];
}

export interface ComputeNextWorkQueueInput {
  readonly tasks: readonly NextWorkTaskInput[];
  readonly taskExecutions?: readonly TaskExecutionRecord[];
  readonly taskVerifications?: readonly TaskVerificationRecord[];
  readonly hiddenTaskIds?: readonly string[];
  readonly hiddenTaskPaths?: readonly string[];
  readonly shippedTaskIds?: readonly string[];
  readonly shippedTaskPaths?: readonly string[];
  readonly shipComplete?: boolean;
}

export interface NextWorkBlocker {
  readonly taskId: string;
  readonly taskPath?: string;
  readonly reason: string;
}

export interface NextWorkQueueItem {
  readonly taskId: string;
  readonly taskPath: string;
  readonly title: string;
  readonly state: "ready" | "blocked";
  readonly blockingDependencies: readonly NextWorkBlocker[];
  readonly blocker?: string;
}

export interface NextWorkQueue {
  readonly ready: readonly NextWorkQueueItem[];
  readonly blocked: readonly NextWorkQueueItem[];
  readonly items: readonly NextWorkQueueItem[];
}

export function computeNextWorkQueue(input: ComputeNextWorkQueueInput): NextWorkQueue {
  if (input.shipComplete) {
    return { ready: [], blocked: [], items: [] };
  }

  const taskById = new Map(input.tasks.map((task) => [task.taskId, task]));
  const executionsByTaskId = new Map((input.taskExecutions ?? []).map((execution) => [execution.taskId, execution]));
  const verificationsByTaskId = new Map(
    (input.taskVerifications ?? []).map((verification) => [verification.taskId, verification]),
  );
  const hiddenTaskIds = new Set(input.hiddenTaskIds ?? []);
  const hiddenTaskPaths = new Set(input.hiddenTaskPaths ?? []);
  const shippedTaskIds = new Set(input.shippedTaskIds ?? []);
  const shippedTaskPaths = new Set(input.shippedTaskPaths ?? []);

  const items: NextWorkQueueItem[] = input.tasks.flatMap((task) => {
    if (
      hiddenTaskIds.has(task.taskId) ||
      hiddenTaskPaths.has(task.taskPath) ||
      shippedTaskIds.has(task.taskId) ||
      shippedTaskPaths.has(task.taskPath) ||
      isTaskDone(task.taskId, executionsByTaskId, verificationsByTaskId)
    ) {
      return [];
    }

    const execution = executionsByTaskId.get(task.taskId);
    const blockingDependencies = unique(task.dependencies).flatMap((dependencyId) => {
      const dependency = taskById.get(dependencyId);
      if (!dependency) {
        return [{ taskId: dependencyId, reason: "Missing dependency" }];
      }
      if (isTaskComplete(dependency.taskId, executionsByTaskId, verificationsByTaskId)) {
        return [];
      }
      return [
        {
          taskId: dependency.taskId,
          taskPath: dependency.taskPath,
          reason: "Dependency is not done with evidence",
        },
      ];
    });
    const blocker = execution?.status === "blocked" ? execution.blocker || "Marked blocked" : undefined;
    const state: NextWorkQueueItem["state"] = blockingDependencies.length > 0 || blocker ? "blocked" : "ready";

    return [
      {
        taskId: task.taskId,
        taskPath: task.taskPath,
        title: task.title,
        state,
        blockingDependencies,
        ...(blocker ? { blocker } : {}),
      },
    ];
  });

  return {
    ready: items.filter((item) => item.state === "ready"),
    blocked: items.filter((item) => item.state === "blocked"),
    items,
  };
}

function isTaskDone(
  taskId: string,
  executionsByTaskId: ReadonlyMap<string, TaskExecutionRecord>,
  verificationsByTaskId: ReadonlyMap<string, TaskVerificationRecord>,
): boolean {
  return executionsByTaskId.get(taskId)?.status === "done" || verificationsByTaskId.get(taskId)?.status === "passed";
}

function isTaskComplete(
  taskId: string,
  executionsByTaskId: ReadonlyMap<string, TaskExecutionRecord>,
  verificationsByTaskId: ReadonlyMap<string, TaskVerificationRecord>,
): boolean {
  const execution = executionsByTaskId.get(taskId);
  return (
    (execution?.status === "done" && execution.evidence.length > 0) ||
    verificationsByTaskId.get(taskId)?.status === "passed"
  );
}

function unique(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter((value) => {
      if (!value || seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
}
