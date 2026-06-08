export interface GetPullRequestApiRequest {
  projectId: string;
  repositoryId: string;
  pullRequestId: string;
  page: number;
  size: number;
}
