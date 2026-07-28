export interface FunctionalTechnicalRebasePayload {
  sourceBranchName: string;
  targetBranchName: string;
  mtsUrl?: string | null;
}

export interface FunctionalTechnicalRebaseApiRequest {
  projectId: string;
  remoteClonedRepositoryId: string;
  payload: FunctionalTechnicalRebasePayload;
}
