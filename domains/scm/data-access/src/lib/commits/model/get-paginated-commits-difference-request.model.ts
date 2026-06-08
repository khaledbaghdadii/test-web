export interface GetPaginatedCommitsDifferenceRequest {
  readonly projectId: string;
  readonly repositoryId: string;
  readonly source: string;
  readonly destination: string;
  readonly page: number;
  readonly size: number;
}
