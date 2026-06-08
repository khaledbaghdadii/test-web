export interface SaveBundleChangesApiRequest {
  projectId: string;
  remoteClonedRepositoryId: string;
  payload: SaveBundleChangesPayload;
}

export interface SaveBundleChangesPayload {
  content: string;
}
