import assert from "node:assert/strict";
import test from "node:test";
import { computeNextWorkQueue } from "../dist/index.js";

test("computes ready and dependency-blocked next work in task order", () => {
  const tasks = [
    task("T1", "M1/S1/T1", "Build foundation"),
    task("T2", "M1/S1/T2", "Use foundation", ["T1"]),
    task("T3", "M1/S1/T3", "Independent check"),
  ];

  const initialQueue = computeNextWorkQueue({ tasks });

  assert.deepEqual(initialQueue.ready.map((item) => item.taskId), ["T1", "T3"]);
  assert.deepEqual(initialQueue.blocked.map((item) => item.taskId), ["T2"]);
  assert.deepEqual(initialQueue.blocked[0]?.blockingDependencies, [
    {
      taskId: "T1",
      taskPath: "M1/S1/T1",
      reason: "Dependency is not done with evidence",
    },
  ]);

  const afterT1Done = computeNextWorkQueue({
    tasks,
    taskExecutions: [doneExecution("T1", "M1/S1/T1")],
  });

  assert.deepEqual(afterT1Done.ready.map((item) => item.taskId), ["T2", "T3"]);
  assert.deepEqual(afterT1Done.blocked, []);
});

test("excludes done, verified, hidden, and shipped work while retaining explicit blockers", () => {
  const tasks = [
    task("T1", "M1/S1/T1", "Blocked task"),
    task("T2", "M1/S1/T2", "Done task"),
    task("T3", "M1/S1/T3", "Verified task"),
    task("T4", "M1/S1/T4", "Hidden task"),
    task("T5", "M1/S1/T5", "Shipped task"),
    task("T6", "M1/S1/T6", "Ready task"),
  ];

  const queue = computeNextWorkQueue({
    tasks,
    taskExecutions: [
      {
        taskId: "T1",
        taskPath: "M1/S1/T1",
        status: "blocked",
        note: "Started",
        blocker: "Waiting on dependency owner",
        evidence: [],
        updatedAt: "2026-05-17T00:00:00.000Z",
      },
      doneExecution("T2", "M1/S1/T2"),
    ],
    taskVerifications: [
      {
        id: "verification-1",
        taskId: "T3",
        taskPath: "M1/S1/T3",
        acceptance: "Verified task acceptance",
        status: "passed",
        note: "Passed",
        createdAt: "2026-05-17T00:00:00.000Z",
      },
    ],
    hiddenTaskIds: ["T4"],
    shippedTaskPaths: ["M1/S1/T5"],
  });

  assert.deepEqual(queue.items.map((item) => item.taskId), ["T1", "T6"]);
  assert.deepEqual(queue.ready.map((item) => item.taskId), ["T6"]);
  assert.equal(queue.blocked[0]?.taskId, "T1");
  assert.equal(queue.blocked[0]?.blocker, "Waiting on dependency owner");
  assert.deepEqual(computeNextWorkQueue({ tasks, shipComplete: true }).items, []);
});

function task(taskId, taskPath, title, dependencies = []) {
  return {
    taskId,
    taskPath,
    title,
    dependencies,
  };
}

function doneExecution(taskId, taskPath) {
  return {
    taskId,
    taskPath,
    status: "done",
    note: "Done",
    blocker: "",
    evidence: [
      {
        id: `${taskId}-evidence`,
        taskId,
        taskPath,
        text: "Evidence recorded",
        createdAt: "2026-05-17T00:00:00.000Z",
      },
    ],
    updatedAt: "2026-05-17T00:00:00.000Z",
  };
}
