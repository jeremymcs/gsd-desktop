# T01 Summary: Planning Store Bridge

Added desktop planning state keyed by root workspace plus narrow IPC methods for loading, creating, selecting, answering, revising, and confirming plans. SQLite access stays in the Electron main process, and renderer updates flow through the existing app-state publisher.

Verification:
- `pnpm --filter @pi-gui/desktop typecheck`
- `pnpm --filter @pi-gui/desktop build`
