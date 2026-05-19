import type { MouseEvent as ReactMouseEvent } from "react";
import type { WorkspaceRecord } from "./desktop-state";
import { DiffIcon, FolderIcon, PlusIcon, TerminalIcon } from "./icons";
import { getDesktopShortcutLabel, type PiDesktopApi } from "./ipc";

interface TopbarProps {
  readonly activeWorkspaceId: string;
  readonly workspaces: readonly WorkspaceRecord[];
  readonly api: PiDesktopApi;
  readonly terminalAvailable: boolean;
  readonly terminalVisible: boolean;
  readonly onSelectWorkspace: (workspaceId: string) => void;
  readonly onAddWorkspace: () => void;
  readonly onToggleTerminal: () => void;
  readonly showDiffPanel: boolean;
  readonly onToggleDiffPanel: () => void;
}

export function Topbar(props: TopbarProps) {
  const {
    activeWorkspaceId,
    workspaces,
    api,
    terminalAvailable,
    terminalVisible,
    onSelectWorkspace,
    onAddWorkspace,
    onToggleTerminal,
    showDiffPanel,
    onToggleDiffPanel,
  } = props;
  const terminalShortcut = getDesktopShortcutLabel(api.platform, "J");
  const diffShortcut = getDesktopShortcutLabel(api.platform, "D");

  const handleDoubleClick = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest(".topbar__actions") || target.closest(".workspace-tabs")) {
      return;
    }

    void api.toggleWindowMaximize();
  };

  return (
    <header className="topbar" data-testid="topbar" onDoubleClick={handleDoubleClick}>
      <nav className="workspace-tabs" aria-label="Project workspaces">
        {workspaces.length > 0 ? (
          workspaces.map((workspace) => {
            const active = workspace.id === activeWorkspaceId;
            return (
              <button
                aria-current={active ? "page" : undefined}
                className={`workspace-tabs__tab ${active ? "workspace-tabs__tab--active" : ""}`}
                key={workspace.id}
                type="button"
                onClick={() => onSelectWorkspace(workspace.id)}
              >
                <FolderIcon />
                <span>{workspace.name}</span>
              </button>
            );
          })
        ) : (
          <button className="workspace-tabs__tab workspace-tabs__tab--empty" type="button" onClick={onAddWorkspace}>
            <FolderIcon />
            <span>Open workspace</span>
          </button>
        )}
        <button aria-label="Open workspace" className="workspace-tabs__add" type="button" onClick={onAddWorkspace}>
          <PlusIcon />
        </button>
      </nav>

      <div className="topbar__actions">
        <div className="shortcut-tooltip-wrap topbar__tooltip-wrap">
          <button
            aria-label="Toggle terminal"
            className={`icon-button topbar__icon ${terminalVisible ? "icon-button--active" : ""}`}
            type="button"
            disabled={!terminalAvailable}
            onClick={onToggleTerminal}
          >
            <TerminalIcon />
          </button>
          <span className="shortcut-tooltip topbar__tooltip" role="tooltip">
            <span>Toggle terminal</span>
            <kbd>{terminalShortcut}</kbd>
          </span>
        </div>
        <div className="shortcut-tooltip-wrap topbar__tooltip-wrap">
          <button
            aria-label="Toggle changes"
            className={`icon-button topbar__icon ${showDiffPanel ? "icon-button--active" : ""}`}
            type="button"
            onClick={onToggleDiffPanel}
          >
            <DiffIcon />
          </button>
          <span className="shortcut-tooltip topbar__tooltip" role="tooltip">
            <span>Toggle changes</span>
            <kbd>{diffShortcut}</kbd>
          </span>
        </div>
      </div>
    </header>
  );
}
