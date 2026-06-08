export interface RemoteClonedRepositoryStateApiResponse {
  remoteClonedRepositoryState: RemoteClonedRepositoryState;
}

export enum RemoteClonedRepositoryState {
  PREPARING = "PREPARING",
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  PREPARATION_FAILED = "PREPARATION_FAILED",
}
