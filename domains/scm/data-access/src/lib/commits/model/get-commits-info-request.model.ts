export interface GetCommitsInfoRequest {
  readonly projectId: string;
  readonly repositoryId: string;
  readonly commitIds: string[];
}
