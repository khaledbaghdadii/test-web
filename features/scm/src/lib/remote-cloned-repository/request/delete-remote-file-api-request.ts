export interface DeleteRemoteFileApiRequest {
  projectId: string;
  remoteClonedRepositoryId: string;
  filePath: string;
  checkRepositoryAvailability?: boolean;
}
