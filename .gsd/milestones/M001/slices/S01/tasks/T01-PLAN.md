# T01: Package scaffold and types

**Slice:** S01
**Milestone:** M001

## Goal

Create the public package contract for the shared planning engine.

## Must-Haves

### Truths

- The repo contains a workspace package named `@pi-gui/gsd-planning`.
- The package builds with the repo's TypeScript conventions.
- Public exports include planning IDs, phases/stages, event types, requirement types, snapshot types, and `PlanningStore`.

### Artifacts

- `packages/gsd-planning/package.json` - package metadata, exports, build/test scripts.
- `packages/gsd-planning/tsconfig.json` - TypeScript config matching existing packages.
- `packages/gsd-planning/src/types.ts` - domain types and interface.
- `packages/gsd-planning/src/index.ts` - public export surface.

### Key Links

- `index.ts` -> `types.ts` via explicit ESM export.
- Package export map -> `dist/index.js` and `dist/index.d.ts`.

## Steps

1. Mirror the package shape used by `packages/catalogs`.
2. Define stable domain types for plans, requirements, prompt stages, events, and snapshots.
3. Export only the types and store entry points needed by downstream slices.
4. Run package typecheck/build after implementation.

## Context

- S01 is package-only; do not add renderer or Electron UI yet.
- Keep the API narrow so Electron can later expose it through IPC without broad filesystem access.

