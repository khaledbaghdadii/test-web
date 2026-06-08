export interface GetPaginatedCommitsDifferenceApiRequest {
  projectId: string;
  repositoryId: string;
  source: string;
  destination: string;
  page: number;
  size: number;
}
