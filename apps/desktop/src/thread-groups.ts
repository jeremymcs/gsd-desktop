import type { DesktopAppState, SessionRecord, WorkspaceRecord } from "./desktop-state";

export type ThreadPurpose = "general" | "plan" | "research" | "execute" | "review" | "follow-up";

export interface ThreadEnvironmentMeta {
  readonly kind: "local" | "worktree";
  readonly label: string;
  readonly branchName?: string;
  readonly detached?: boolean;
}

export interface ThreadListEntry {
  readonly workspaceId: string;
  readonly session: SessionRecord;
  readonly environment: ThreadEnvironmentMeta;
  readonly purpose: ThreadPurpose;
}

export interface ThreadGroup {
  readonly rootWorkspace: WorkspaceRecord;
  readonly threads: readonly ThreadListEntry[];
  readonly activeThreads: readonly ThreadListEntry[];
  readonly followUpThreads: readonly ThreadListEntry[];
  readonly recentThreads: readonly ThreadListEntry[];
  readonly archivedThreads: readonly ThreadListEntry[];
}

export function buildThreadGroups(state: DesktopAppState): readonly ThreadGroup[] {
  const workspacesById = new Map(state.workspaces.map((workspace) => [workspace.id, workspace] as const));
  const rootWorkspaces = state.workspaces.filter((workspace) => workspace.kind === "primary");
  const orphanWorktrees = state.workspaces.filter(
    (workspace) => workspace.kind === "worktree" && !workspacesById.has(workspace.rootWorkspaceId ?? ""),
  );

  const order = state.workspaceOrder;
  const sortedRoots = [...rootWorkspaces].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    // Workspaces not in the order list come first (newly added)
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return -1;
    if (bi === -1) return 1;
    return ai - bi;
  });

  return [
    ...sortedRoots.map((workspace) => buildRootGroup(state, workspacesById, workspace)),
    ...orphanWorktrees.map(buildOrphanGroup),
  ];
}

function buildRootGroup(
  state: DesktopAppState,
  workspacesById: ReadonlyMap<string, WorkspaceRecord>,
  rootWorkspace: WorkspaceRecord,
): ThreadGroup {
  const linkedWorkspaces = (state.worktreesByWorkspace[rootWorkspace.id] ?? [])
    .map((worktree) => ({
      worktree,
      workspace: worktree.linkedWorkspaceId ? workspacesById.get(worktree.linkedWorkspaceId) : undefined,
    }))
    .filter((entry): entry is { worktree: NonNullable<(typeof state.worktreesByWorkspace)[string][number]>; workspace: WorkspaceRecord } =>
      Boolean(entry.workspace),
    );

  const backlogDiscussionKeys = new Set(
    (state.backlogByWorkspace[rootWorkspace.id] ?? [])
      .map((item) => item.discussionThread)
      .filter((target): target is NonNullable<typeof target> => Boolean(target))
      .map((target) => `${target.workspaceId}:${target.sessionId}`),
  );
  const executionThreadKeys = new Set(
    (state.planningByWorkspace[rootWorkspace.id]?.selectedPlan?.taskSessionLinks ?? []).map(
      (link) => `${link.workspaceId}:${link.sessionId}`,
    ),
  );

  const threads: ThreadListEntry[] = [
    ...rootWorkspace.sessions.map((session) => ({
      workspaceId: rootWorkspace.id,
      session,
      purpose: inferThreadPurpose(rootWorkspace.id, session, backlogDiscussionKeys, executionThreadKeys),
      environment: {
        kind: "local" as const,
        label: "Local",
      },
    })),
    ...linkedWorkspaces.flatMap(({ workspace, worktree }) =>
      workspace.sessions.map((session) => ({
        workspaceId: workspace.id,
        session,
        purpose: inferThreadPurpose(workspace.id, session, backlogDiscussionKeys, executionThreadKeys),
        environment: {
          kind: "worktree" as const,
          label: worktree.name,
          branchName: worktree.branchName,
          detached: !worktree.branchName,
        },
      })),
    ),
  ];

  threads.sort((left, right) => {
    if (left.session.updatedAt !== right.session.updatedAt) {
      return right.session.updatedAt.localeCompare(left.session.updatedAt);
    }
    return left.session.title.localeCompare(right.session.title);
  });

  return partitionThreads(rootWorkspace, threads);
}

function buildOrphanGroup(workspace: WorkspaceRecord): ThreadGroup {
  return partitionThreads(
    workspace,
    workspace.sessions.map((session) => ({
      workspaceId: workspace.id,
      session,
      purpose: "general",
      environment: {
        kind: "worktree",
        label: workspace.name,
        branchName: workspace.branchName,
        detached: !workspace.branchName,
      },
    })),
  );
}

function partitionThreads(rootWorkspace: WorkspaceRecord, entries: readonly ThreadListEntry[]): ThreadGroup {
  const threads = entries.filter((entry) => !entry.session.archivedAt);
  const activeThreads = threads.filter((entry) => entry.session.status === "running" || entry.session.hasUnseenUpdate);
  const activeKeys = new Set(activeThreads.map(threadKey));
  const followUpThreads = threads.filter((entry) => entry.purpose === "follow-up" && !activeKeys.has(threadKey(entry)));
  const followUpKeys = new Set(followUpThreads.map(threadKey));
  return {
    rootWorkspace,
    threads,
    activeThreads,
    followUpThreads,
    recentThreads: threads.filter((entry) => !activeKeys.has(threadKey(entry)) && !followUpKeys.has(threadKey(entry))),
    archivedThreads: entries.filter((entry) => Boolean(entry.session.archivedAt)),
  };
}

function inferThreadPurpose(
  workspaceId: string,
  session: SessionRecord,
  backlogDiscussionKeys: ReadonlySet<string>,
  executionThreadKeys: ReadonlySet<string>,
): ThreadPurpose {
  const key = `${workspaceId}:${session.id}`;
  if (backlogDiscussionKeys.has(key)) {
    return "follow-up";
  }
  if (executionThreadKeys.has(key)) {
    return "execute";
  }
  return "general";
}

function threadKey(entry: ThreadListEntry): string {
  return `${entry.workspaceId}:${entry.session.id}`;
}
