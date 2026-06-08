export interface WriteRemoteFileContentApiRequest {
  projectId: string;
  remoteClonedRepositoryId: string;
  filePath: string;
  fileContent: string;
  checkRepositoryAvailability: boolean;
}
