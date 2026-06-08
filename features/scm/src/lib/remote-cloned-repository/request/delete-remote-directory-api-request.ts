export interface DeleteRemoteDirectoryApiRequest {
  projectId: string;
  remoteClonedRepositoryId: string;
  directoryPath: string;
  checkRepositoryAvailability: boolean;
}
