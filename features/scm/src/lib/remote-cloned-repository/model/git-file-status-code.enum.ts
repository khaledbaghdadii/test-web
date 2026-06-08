/**
 * Mirrors git porcelain XY status codes for conflicting/working-tree file states.
 */
export enum GitFileStatusCode {
  BOTH_ADDED = "AA",
  BOTH_DELETED = "DD",
  BOTH_MODIFIED = "UU",
  ADDED_LOCALLY = "AU",
  ADDED_REMOTELY = "UA",
  DELETED_LOCALLY = "UD",
  DELETED_REMOTELY = "DU",
  INDEX_MODIFIED = "M ",
  WORKTREE_MODIFIED = " M",
  INDEX_ADDED = "A ",
  INDEX_ADDED_WORKTREE_MODIFIED = "AM",
  INDEX_ADDED_WORKTREE_DELETED = "AD",
  INDEX_DELETED = "D ",
  WORKTREE_DELETED = " D",
  INDEX_RENAMED = "R ",
  INDEX_COPIED = "C ",
  UNTRACKED = "??",
  IGNORED = "!!",
  UNKNOWN = "  ",
}
