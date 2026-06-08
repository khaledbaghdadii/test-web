export enum RemoteClonedRepositoryOperationType {
  CLONE_AND_SYNC = "CLONE_AND_SYNC",
  COMMIT_FILES = "COMMIT_FILES",
  COMMIT_AND_PUSH = "COMMIT_AND_PUSH",
  REBASE = "REBASE",
  RESET_CHANGES = "RESET_CHANGES",
  CHECK_FUNCTIONAL_CONFLICTS = "CHECK_FUNCTIONAL_CONFLICTS",
  TECHNICAL_REBASE = "TECHNICAL_REBASE",
}

export enum RemoteClonedRepositoryOperationStatus {
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  IN_PROGRESS = "IN_PROGRESS",
}

export interface RemoteClonedRepositoryOperationApiResponse {
  id: string;
  remoteClonedRepositoryId: string;
  type: RemoteClonedRepositoryOperationType;
  status: RemoteClonedRepositoryOperationStatus;
  endedOn?: string;
  failureReason?: string;
}
