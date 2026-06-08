import { RemoteClonedRepositoryOperationApiResponse } from "./remote-cloned-repository-operation-api-response";
import { ConflictingFileMetadataApiResponse } from "./conflicting-files-metadata-api-response";

export enum RebaseState {
  MXTEST_FUNCTIONAL_REBASE_IN_PROGRESS = "MXTEST_FUNCTIONAL_REBASE_IN_PROGRESS",
  TECHNICAL_REBASE_IN_PROGRESS = "TECHNICAL_REBASE_IN_PROGRESS",
  MXTEST_FUNCTIONAL_REBASE_IN_CONFLICT = "MXTEST_FUNCTIONAL_REBASE_IN_CONFLICT",
  TECHNICAL_REBASE_IN_CONFLICT = "TECHNICAL_REBASE_IN_CONFLICT",
}

export interface GetRebaseOperationInfoApiResponse {
  rebaseInProgress: boolean;
  sourceBranchName: string;
  targetBranchName: string;
  rebaseState?: RebaseState;
  rebaseOperations: RemoteClonedRepositoryOperationApiResponse[];
  conflictingFiles?: ConflictingFileMetadataApiResponse[];
  bundleContent?: string;
}
