# S01 Summary: Project Shape Capture

Plan Builder now captures project shape as part of the project DISCUSS stage.

## Changes

- Added a load-bearing `Shape` question: `Is this project simple or complex?`
- Persisted the answer into `ProjectSummary.shape` through the existing append-only answer and project patch flow.
- Defaulted conservatively to `complex` unless the answer starts with `simple`.
- Updated the Plan Builder Electron regression so generated `PROJECT.md` must include the saved complexity and rationale.

## Notes

This closes the first prompt-corpus parity gap without importing raw prompt Markdown at runtime.
