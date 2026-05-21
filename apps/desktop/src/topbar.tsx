import type { MouseEvent as ReactMouseEvent } from "react";
import type { WorkspaceRecord } from "./desktop-state";
import { DiffIcon, FolderIcon, PlusIcon, SearchIcon, TerminalIcon } from "./icons";
import { getDesktopShortcutLabel, type PiDesktopApi } from "./ipc";

interface TopbarProps {
  readonly activeTitle: string;
  readonly activeWorkspaceId: string;
  readonly workspaces: readonly WorkspaceRecord[];
  readonly api: PiDesktopApi;
  readonly terminalAvailable: boolean;
  readonly terminalVisible: boolean;
  readonly onSelectWorkspace: (workspaceId: string) => void;
  readonly onAddWorkspace: () => void;
  readonly onToggleTerminal: () => void;
  readonly onOpenSearch: () => void;
  readonly showDiffPanel: boolean;
  readonly onToggleDiffPanel: () => void;
}

export function Topbar(props: TopbarProps) {
  const {
    activeWorkspaceId,
    activeTitle,
    workspaces,
    api,
    terminalAvailable,
    terminalVisible,
    onSelectWorkspace,
    onAddWorkspace,
    onToggleTerminal,
    onOpenSearch,
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

    const workspaceTab = target.closest(".workspace-tabs__tab");
    if (
      target.closest(".topbar__actions") ||
      target.closest(".workspace-tabs__add") ||
      (workspaceTab && !workspaceTab.classList.contains("workspace-tabs__tab--active"))
    ) {
      return;
    }

    void api.toggleWindowMaximize();
  };

  return (
    <header className="topbar" data-testid="topbar" onDoubleClick={handleDoubleClick}>
      <span className="topbar__session sr-only">{activeTitle}</span>
      <nav className="workspace-tabs" aria-label="Projects" data-testid="workspace-list">
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
            <span>Open Project</span>
          </button>
        )}
        <button aria-label="Add Project Folder" className="workspace-tabs__add" type="button" onClick={onAddWorkspace}>
          <PlusIcon />
        </button>
      </nav>

      <div className="topbar__actions">
        <div className="shortcut-tooltip-wrap topbar__tooltip-wrap">
          <button
            aria-label="Search"
            className="icon-button topbar__icon"
            type="button"
            onClick={onOpenSearch}
          >
            <SearchIcon />
          </button>
          <span className="shortcut-tooltip topbar__tooltip" role="tooltip">
            <span>Search</span>
          </span>
        </div>
        <div className="shortcut-tooltip-wrap topbar__tooltip-wrap">
          <button
            aria-label="Toggle Terminal"
            className={`icon-button topbar__icon ${terminalVisible ? "icon-button--active" : ""}`}
            type="button"
            disabled={!terminalAvailable}
            onClick={onToggleTerminal}
          >
            <TerminalIcon />
          </button>
          <span className="shortcut-tooltip topbar__tooltip" role="tooltip">
            <span>Toggle Terminal</span>
            <kbd>{terminalShortcut}</kbd>
          </span>
        </div>
        <div className="shortcut-tooltip-wrap topbar__tooltip-wrap">
          <button
            aria-label="Toggle Changes"
            className={`icon-button topbar__icon ${showDiffPanel ? "icon-button--active" : ""}`}
            type="button"
            onClick={onToggleDiffPanel}
          >
            <DiffIcon />
          </button>
          <span className="shortcut-tooltip topbar__tooltip" role="tooltip">
            <span>Toggle Changes</span>
            <kbd>{diffShortcut}</kbd>
          </span>
        </div>
      </div>
    </header>
  );
}
