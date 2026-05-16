# T03: Package tests and workspace wiring

**Slice:** S01
**Milestone:** M001

## Goal

Verify the planning package with focused tests and workspace dependency wiring.

## Must-Haves

### Truths

- Package tests pass against built output.
- Tests prove create/open, replay after reopen, requirement records, and stale revision rejection.
- The root workspace lockfile includes the SQLite dependency.
- The package participates in root build/typecheck scripts through existing workspace globs.

### Artifacts

- `packages/gsd-planning/test/planning-store.test.mjs` - Node test coverage.
- `pnpm-lock.yaml` - dependency lockfile update.
- `pnpm-workspace.yaml` - native build allowlist updated if needed.

### Key Links

- Test imports -> `packages/gsd-planning/dist/index.js`.
- Package scripts -> build before test.

## Steps

1. Add tests using `node:test` and temporary directories.
2. Add `better-sqlite3` and types to the package.
3. Update native build allowlist so dependency install/build is explicit.
4. Run package build/test and a focused root typecheck if practical.

## Context

- S01 does not need Electron UI tests; those start once the package is wired into the desktop app.

