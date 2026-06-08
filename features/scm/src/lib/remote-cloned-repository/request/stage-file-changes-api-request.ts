export interface StageFileChangesApiRequest {
  projectId: string;
  remoteClonedRepositoryId: string;
  filePaths: string[];
  stageAll: boolean;
}
