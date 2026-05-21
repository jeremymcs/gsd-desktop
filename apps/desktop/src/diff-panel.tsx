import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import type { PiDesktopApi } from "./ipc";
import { InlineDiff } from "./diff-inline";
import { RefreshIcon } from "./icons";
import { extensionToLanguage } from "./syntax-highlight";
import { loadReviewed, pruneReviewed, saveReviewed } from "./reviewed-files-store";
import { MessageMarkdown } from "./message-markdown";

export const DIFF_PANEL_DEFAULT_WIDTH = 400;
const DIFF_PANEL_MIN_WIDTH = 320;
const DIFF_PANEL_MAX_WIDTH = 720;
const DIFF_PANEL_KEYBOARD_STEP = 24;

interface ChangedFile {
  readonly path: string;
  readonly status: "added" | "modified" | "deleted" | "untracked";
  readonly staged: boolean;
}

export interface DiffPanelFileRequest {
  readonly path: string;
  readonly nonce: number;
}

interface DiffPanelProps {
  readonly workspaceId: string;
  readonly sessionId: string;
  readonly api: PiDesktopApi;
  readonly sessionStatus: string | undefined;
  readonly fileRequest?: DiffPanelFileRequest | null;
  readonly width: number;
  readonly onWidthChange: (width: number) => void;
}

export function DiffPanel({
  workspaceId,
  sessionId,
  api,
  sessionStatus,
  fileRequest,
  width,
  onWidthChange,
}: DiffPanelProps) {
  const [files, setFiles] = useState<readonly ChangedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffText, setDiffText] = useState("");
  const [fileText, setFileText] = useState("");
  const [fileTextError, setFileTextError] = useState<string | null>(null);
  const [markdownMode, setMarkdownMode] = useState<"preview" | "raw">("preview");
  const [loading, setLoading] = useState(false);
  const [reviewed, setReviewed] = useState<ReadonlySet<string>>(() =>
    loadReviewed(workspaceId, sessionId),
  );
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setReviewed(loadReviewed(workspaceId, sessionId));
  }, [workspaceId, sessionId]);

  const refresh = useCallback(() => {
    setLoading(true);
    void api.getChangedFiles(workspaceId).then((result) => {
      setFiles(result);
      setSelectedFile((current) =>
        current && !result.some((f) => f.path === current) ? null : current,
      );
      setReviewed((current) => {
        const pruned = pruneReviewed(current, result.map((f) => f.path));
        if (pruned !== current) {
          saveReviewed(workspaceId, sessionId, pruned);
        }
        return pruned;
      });
      setLoading(false);
    });
  }, [api, workspaceId, sessionId]);

  const prevStatusRef = useRef(sessionStatus);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = sessionStatus;
    if (prev === "running" && sessionStatus !== "running") {
      refresh();
    }
  }, [sessionStatus, refresh]);

  useEffect(() => {
    refresh();
  }, [workspaceId, sessionId]);

  useEffect(() => {
    if (!fileRequest) return;
    setSelectedFile(fileRequest.path);
  }, [fileRequest]);

  useEffect(() => {
    if (!selectedFile) {
      setDiffText("");
      return;
    }
    void api.getFileDiff(workspaceId, selectedFile).then(setDiffText);
  }, [api, workspaceId, selectedFile]);

  const selectedFileIsMarkdown = selectedFile ? isMarkdownFile(selectedFile) : false;

  useEffect(() => {
    setMarkdownMode("preview");
    setFileText("");
    setFileTextError(null);
  }, [selectedFile]);

  useEffect(() => {
    if (!selectedFile || !selectedFileIsMarkdown) {
      return;
    }

    let cancelled = false;
    void api
      .getFileContent(workspaceId, selectedFile)
      .then((content) => {
        if (!cancelled) {
          setFileText(content);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFileTextError("Markdown source is unavailable.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [api, workspaceId, selectedFile, selectedFileIsMarkdown]);

  const fileListRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!selectedFile) return;
    const row = fileListRef.current?.querySelector<HTMLElement>(
      `[data-file-path="${CSS.escape(selectedFile)}"]`,
    );
    row?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [selectedFile, files]);

  const handleStage = (filePath: string) => {
    void api.stageFile(workspaceId, filePath).then(refresh);
  };

  const toggleReviewed = useCallback(
    (filePath: string) => {
      setReviewed((current) => {
        const next = new Set(current);
        if (next.has(filePath)) {
          next.delete(filePath);
        } else {
          next.add(filePath);
        }
        saveReviewed(workspaceId, sessionId, next);
        return next;
      });
    },
    [workspaceId, sessionId],
  );

  const reviewedCount = useMemo(
    () => files.reduce((acc, f) => acc + (reviewed.has(f.path) ? 1 : 0), 0),
    [files, reviewed],
  );

  const startResize = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();

      const startX = event.clientX;
      const startWidth = panelRef.current?.getBoundingClientRect().width ?? width;
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;

      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";

      const handleMouseMove = (moveEvent: MouseEvent) => {
        onWidthChange(clampDiffPanelWidth(startWidth + startX - moveEvent.clientX));
      };
      const stopResize = () => {
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        window.removeEventListener("mousemove", handleMouseMove);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResize, { once: true });
    },
    [onWidthChange, width],
  );

  const handleResizeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onWidthChange(clampDiffPanelWidth(width + DIFF_PANEL_KEYBOARD_STEP));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onWidthChange(clampDiffPanelWidth(width - DIFF_PANEL_KEYBOARD_STEP));
      } else if (event.key === "Home") {
        event.preventDefault();
        onWidthChange(DIFF_PANEL_MIN_WIDTH);
      } else if (event.key === "End") {
        event.preventDefault();
        onWidthChange(DIFF_PANEL_MAX_WIDTH);
      }
    },
    [onWidthChange, width],
  );

  return (
    <aside className="diff-panel" ref={panelRef}>
      <div
        aria-label="Resize Changes panel"
        aria-orientation="vertical"
        aria-valuemax={DIFF_PANEL_MAX_WIDTH}
        aria-valuemin={DIFF_PANEL_MIN_WIDTH}
        aria-valuenow={Math.round(width)}
        className="diff-panel__resize-handle"
        onKeyDown={handleResizeKeyDown}
        onMouseDown={startResize}
        role="separator"
        tabIndex={0}
      />
      <div className="diff-panel__header">
        <h2 className="diff-panel__title">Changes</h2>
        {files.length > 0 ? (
          <span className="diff-panel__counter" data-testid="diff-panel-counter">
            {`Reviewed ${reviewedCount} of ${files.length}`}
          </span>
        ) : null}
        <button
          className="icon-button"
          type="button"
          onClick={refresh}
          aria-label="Refresh Changes"
          disabled={loading}
        >
          <RefreshIcon />
        </button>
      </div>

      {files.length === 0 ? (
        <div className="diff-panel__empty">No Changes</div>
      ) : (
        <>
          <div className="diff-panel__file-list" ref={fileListRef}>
            {files.map((file) => {
              const isReviewed = reviewed.has(file.path);
              const isSelected = selectedFile === file.path;
              const className = [
                "diff-panel__file",
                isSelected ? "diff-panel__file--selected" : "",
                isReviewed ? "diff-panel__file--reviewed" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div className={className} key={file.path} data-file-path={file.path}>
                  <input
                    aria-label={`Mark ${file.path} reviewed`}
                    className="diff-panel__reviewed-checkbox"
                    data-testid={`diff-panel-reviewed-${file.path}`}
                    type="checkbox"
                    checked={isReviewed}
                    onChange={() => toggleReviewed(file.path)}
                  />
                  <button
                    className="diff-panel__file-name"
                    type="button"
                    onClick={() => setSelectedFile(file.path === selectedFile ? null : file.path)}
                  >
                    <span className={`diff-panel__status-dot diff-panel__status-dot--${file.status}`} />
                    <span>{file.path}</span>
                  </button>
                  <button
                    className="diff-panel__stage-btn"
                    type="button"
                    onClick={() => handleStage(file.path)}
                    disabled={file.staged}
                  >
                    {file.staged ? "Staged" : "Stage"}
                  </button>
                </div>
              );
            })}
          </div>

          {selectedFile && diffText ? (
            <div className="diff-panel__viewer">
              <div className="diff-panel__viewer-header">
                <span>{selectedFile}</span>
                {selectedFileIsMarkdown ? (
                  <div className="diff-panel__mode-toggle" role="group" aria-label="Markdown view mode">
                    <button
                      aria-pressed={markdownMode === "preview"}
                      className={`diff-panel__mode-button ${markdownMode === "preview" ? "diff-panel__mode-button--active" : ""}`}
                      type="button"
                      onClick={() => setMarkdownMode("preview")}
                    >
                      Preview
                    </button>
                    <button
                      aria-pressed={markdownMode === "raw"}
                      className={`diff-panel__mode-button ${markdownMode === "raw" ? "diff-panel__mode-button--active" : ""}`}
                      type="button"
                      onClick={() => setMarkdownMode("raw")}
                    >
                      Raw
                    </button>
                  </div>
                ) : null}
              </div>
              {selectedFileIsMarkdown ? (
                <MarkdownFileViewer text={fileText} error={fileTextError} mode={markdownMode} />
              ) : (
                <InlineDiff diff={diffText} language={extensionToLanguage(selectedFile)} />
              )}
            </div>
          ) : null}
        </>
      )}
    </aside>
  );
}

function clampDiffPanelWidth(width: number): number {
  return Math.max(DIFF_PANEL_MIN_WIDTH, Math.min(DIFF_PANEL_MAX_WIDTH, width));
}

function isMarkdownFile(filePath: string): boolean {
  return /\.(md|markdown)$/i.test(filePath);
}

function MarkdownFileViewer({
  text,
  error,
  mode,
}: {
  readonly text: string;
  readonly error: string | null;
  readonly mode: "preview" | "raw";
}) {
  if (error) {
    return <div className="diff-panel__viewer-empty">{error}</div>;
  }

  if (mode === "raw") {
    return (
      <pre className="diff-panel__raw-markdown" data-testid="diff-panel-markdown-raw">
        {text}
      </pre>
    );
  }

  return (
    <div className="diff-panel__markdown-preview" data-testid="diff-panel-markdown-preview">
      <MessageMarkdown text={text || " "} />
    </div>
  );
}
