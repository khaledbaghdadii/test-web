import { GitFileStatus } from "@mxflow/ui/file-tree";
import { GitFileStatusCode } from "./git-file-status-code.enum";
import { mapGitFileStatusCodeToGitFileStatus } from "./git-file-status.mapper";

describe("mapGitFileStatusCodeToGitFileStatus", () => {
  it.each([
    [GitFileStatusCode.BOTH_ADDED, GitFileStatus.Conflicted],
    [GitFileStatusCode.BOTH_DELETED, GitFileStatus.Conflicted],
    [GitFileStatusCode.BOTH_MODIFIED, GitFileStatus.Conflicted],
    [GitFileStatusCode.ADDED_LOCALLY, GitFileStatus.Conflicted],
    [GitFileStatusCode.ADDED_REMOTELY, GitFileStatus.Conflicted],
    [GitFileStatusCode.DELETED_LOCALLY, GitFileStatus.Conflicted],
    [GitFileStatusCode.DELETED_REMOTELY, GitFileStatus.Conflicted],
    [GitFileStatusCode.INDEX_MODIFIED, GitFileStatus.Modified],
    [GitFileStatusCode.WORKTREE_MODIFIED, GitFileStatus.Modified],
    [GitFileStatusCode.INDEX_ADDED, GitFileStatus.Added],
    [GitFileStatusCode.INDEX_DELETED, GitFileStatus.Deleted],
    [GitFileStatusCode.WORKTREE_DELETED, GitFileStatus.Deleted],
    [GitFileStatusCode.INDEX_RENAMED, GitFileStatus.Renamed],
    [GitFileStatusCode.INDEX_COPIED, GitFileStatus.Copied],
    [GitFileStatusCode.UNTRACKED, GitFileStatus.Untracked],
    [GitFileStatusCode.IGNORED, GitFileStatus.Ignored],
    [GitFileStatusCode.UNKNOWN, GitFileStatus.Unknown],
  ])("maps %s to %s", (code, expected) => {
    expect(mapGitFileStatusCodeToGitFileStatus(code)).toBe(expected);
  });
});
