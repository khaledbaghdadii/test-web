export interface CreateRemoteDirectoryApiRequest {
  projectId: string;
  remoteClonedRepositoryId: string;
  directoryPath: string;
  checkRepositoryAvailability: boolean;
}
