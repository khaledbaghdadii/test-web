export interface ResetChangesApiRequest {
  projectId: string;
  remoteClonedRepositoryId: string;
  fileAndDirectoryPathsToReset: string[];
}
