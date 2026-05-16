# T02: Safe projection writer

**Slice:** S02
**Milestone:** M001

## Goal

Write generated projections safely without trampling legacy files or producing noisy diffs.

## Must-Haves

### Truths

- First write creates the expected `.gsd` files.
- Second write with identical content skips every file.
- Existing files without the generated header are blocked as legacy conflicts by default.
- Explicit overwrite can replace a legacy file.
- Writes are atomic using a temporary file and rename.

### Artifacts

- `packages/gsd-planning/src/projection-writer.ts` - safe write and regeneration APIs.
- `packages/gsd-planning/src/index.ts` - public writer exports.

### Key Links

- Projection file list -> writer result with written/skipped/conflict counts.
- Ownership header detection -> legacy conflict behavior.
- Temp path -> final projection path via atomic rename.

## Steps

1. Implement ownership detection.
2. Implement changed-file comparison and atomic write.
3. Implement `regenerateProjections` as the manual repair/debug API.
4. Return structured write results for UI/IPC use.

## Context

- Do not add Electron IPC yet; this is package-only.
- Existing manual `.gsd` files must not be silently overwritten.

