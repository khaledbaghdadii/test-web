export interface CommitChangesApiRequest {
  projectId: string;
  remoteClonedRepositoryId: string;
  branchName: string;
  commitMessage: string;
  fileAndDirectoryPathsToCommit: string[];
  commitAuthorDetails?: CommitAuthorDetails;
}

export interface CommitAuthorDetails {
  username: string;
  email: string;
}
