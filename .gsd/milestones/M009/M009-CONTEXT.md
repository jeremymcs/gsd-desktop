# M009: Composer-Driven Plan Questioning

## Vision

Plan Builder should feel like the Codex-style guided workspace in the reference UI. The bottom composer is currently only an affordance, while DISCUSS answers are entered in a card textarea. This milestone makes the composer an active planning input while preserving the deterministic database-backed question flow.

## Success Criteria

- Active DISCUSS questions can be answered from the bottom composer.
- Composer actions use the same append-only answer and parking events as the existing controls.
- The question card remains useful context for prompt, helper text, and adaptive guidance.
- Composer state stays tied to the current active question and survives existing restart behavior.
- Electron coverage proves composer-driven answers and parked notes persist correctly.

## Non-Goals

- Replacing the full PLAN editor with a chat interface.
- Adding model-generated follow-up questions.
- Removing existing card controls before the composer behavior is proven.
