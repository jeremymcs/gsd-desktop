import assert from "node:assert/strict";
import test from "node:test";
import { computeGuardrailWarnings } from "../dist/index.js";

test("computes projection guardrail warnings from deterministic projection state", () => {
  const warnings = computeGuardrailWarnings({
    projection: {
      missing: 1,
      stale: 2,
      conflicts: [".gsd/NEXT.md"],
    },
  });

  assert.deepEqual(
    warnings.map((warning) => [warning.id, warning.condition, warning.title]),
    [
      ["projection-conflict", "dirty-conflict", "Projection write is blocked"],
      ["projection-drift", "scope-ambiguous", "Projection drift was detected"],
    ],
  );
  assert.deepEqual(warnings[0]?.evidence, [".gsd/NEXT.md"]);
  assert.equal(
    warnings[1]?.detail,
    "1 missing and 2 stale generated projection files were detected during the last projection check.",
  );
});

test("computes recovery guardrail warnings for unfinished run stops", () => {
  const warnings = computeGuardrailWarnings({
    runRecoverySummary: recoverySummary({
      stopReason: "task-blocked",
      stopDetail: "Waiting on credentials.",
      resumeTarget: {
        taskId: "T2",
        taskPath: "M1/S1/T2",
        title: "Continue work",
      },
    }),
  });

  assert.equal(warnings.length, 1);
  assert.equal(warnings[0]?.id, "recovery-stop");
  assert.equal(warnings[0]?.condition, "scope-ambiguous");
  assert.equal(warnings[0]?.detail, "M1/S1/T1: Waiting on credentials.");
  assert.deepEqual(warnings[0]?.evidence, ["Resume target: M1/S1/T2"]);
});

test("maps failed verification recovery stops to the tests-fail guardrail", () => {
  const warnings = computeGuardrailWarnings({
    runRecoverySummary: recoverySummary({
      stopReason: "verification-failed",
      stopDetail: "E2E failed.",
    }),
  });

  assert.equal(warnings.length, 1);
  assert.equal(warnings[0]?.condition, "tests-fail");
});

test("does not warn for clean completion recovery stops", () => {
  assert.deepEqual(
    computeGuardrailWarnings({
      projection: {
        missing: 0,
        stale: 0,
        conflicts: [],
      },
      runRecoverySummary: recoverySummary({
        stopReason: "verification-passed",
        stopDetail: "Verification passed.",
      }),
    }),
    [],
  );
});

function recoverySummary(patch) {
  return {
    id: "recovery-1",
    lastAttemptedTask: {
      taskId: "T1",
      taskPath: "M1/S1/T1",
      title: "Build foundation",
    },
    stopReason: patch.stopReason,
    stopDetail: patch.stopDetail,
    ...(patch.resumeTarget ? { resumeTarget: patch.resumeTarget } : {}),
    createdAt: "2026-05-18T00:00:00.000Z",
  };
}
