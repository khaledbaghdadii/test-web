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
