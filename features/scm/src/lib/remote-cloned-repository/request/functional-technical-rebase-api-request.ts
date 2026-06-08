export interface FunctionalTechnicalRebasePayload {
  sourceBranchName: string;
  targetBranchName: string;
}

export interface FunctionalTechnicalRebaseApiRequest {
  projectId: string;
  remoteClonedRepositoryId: string;
  payload: FunctionalTechnicalRebasePayload;
}
