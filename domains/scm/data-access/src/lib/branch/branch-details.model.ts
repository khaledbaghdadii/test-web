export interface BranchDetails {
  readonly latestCommitId: string;
}

export interface GetBranchDetailsRequest {
  readonly projectId: string;
  readonly repositoryId: string;
  readonly branchName: string;
}

/**
 * Error thrown by {@link BranchService.getBranchDetails} that preserves the
 * originating HTTP status code so callers (e.g. the branch-existence async
 * validator) can distinguish a 404 (branch does not exist) from other failures.
 */
export class BranchDetailsError extends Error {
  constructor(message: string, readonly status: number | undefined) {
    super(message);
    this.name = "BranchDetailsError";
  }
}

/**
 * Shown when a branch-existence check cannot be completed — anything other than
 * the 404 that legitimately means "this branch does not exist". Legacy
 * interpolated the raw backend message here, including 500 bodies; a generic
 * message replaces it (VAL-27132 divergence register KEEP-2).
 *
 * Lives beside the error it describes so both the branch input and the eager
 * prefill resolution can report a failed check identically.
 */
export const BRANCH_CHECK_FAILED_MESSAGE =
  "Couldn't validate the branch. Please try again.";
