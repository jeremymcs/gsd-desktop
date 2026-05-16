# T01: Structured PLAN Model and Validator

## Goal

Represent the editable PLAN proposal as structured data that can be projected later and validated before approval.

## Scope

- Define milestone, slice, task, dependency, boundary, and idea-pool draft types.
- Seed a deterministic proposal from DISCUSS answers and accepted RESEARCH.
- Serialize proposal data as generated output content.
- Parse proposal content after restart.
- Validate required fields, dependency existence, self-dependencies, and dependency cycles.

## Verification

- Typecheck catches model contract drift.
- Electron coverage proves validation blocks invalid dependency approval.
