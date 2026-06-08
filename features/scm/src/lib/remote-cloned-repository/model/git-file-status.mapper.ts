import { GitFileStatus } from "@mxflow/ui/file-tree";
import { GitFileStatusCode } from "./git-file-status-code.enum";

export function resolveGitFileStatusCode(raw: string): GitFileStatusCode {
  if (raw in GitFileStatusCode) {
    return GitFileStatusCode[raw as keyof typeof GitFileStatusCode];
  }

  const values = Object.values(GitFileStatusCode) as string[];
  if (values.includes(raw)) {
    return raw as GitFileStatusCode;
  }

  return GitFileStatusCode.UNKNOWN;
}

export function mapGitFileStatusCodeToGitFileStatus(
  codeRaw: string
): GitFileStatus {
  const code = resolveGitFileStatusCode(codeRaw);

  switch (code) {
    case GitFileStatusCode.BOTH_ADDED:
    case GitFileStatusCode.BOTH_DELETED:
    case GitFileStatusCode.BOTH_MODIFIED:
    case GitFileStatusCode.ADDED_LOCALLY:
    case GitFileStatusCode.ADDED_REMOTELY:
    case GitFileStatusCode.DELETED_LOCALLY:
    case GitFileStatusCode.DELETED_REMOTELY:
      return GitFileStatus.Conflicted;

    case GitFileStatusCode.INDEX_MODIFIED:
    case GitFileStatusCode.WORKTREE_MODIFIED:
      return GitFileStatus.Modified;

    case GitFileStatusCode.INDEX_ADDED:
    case GitFileStatusCode.INDEX_ADDED_WORKTREE_MODIFIED:
      return GitFileStatus.Added;

    case GitFileStatusCode.INDEX_ADDED_WORKTREE_DELETED:
    case GitFileStatusCode.INDEX_DELETED:
    case GitFileStatusCode.WORKTREE_DELETED:
      return GitFileStatus.Deleted;

    case GitFileStatusCode.INDEX_RENAMED:
      return GitFileStatus.Renamed;

    case GitFileStatusCode.INDEX_COPIED:
      return GitFileStatus.Copied;

    case GitFileStatusCode.UNTRACKED:
      return GitFileStatus.Untracked;

    case GitFileStatusCode.IGNORED:
      return GitFileStatus.Ignored;

    default:
      return GitFileStatus.Unknown;
  }
}
