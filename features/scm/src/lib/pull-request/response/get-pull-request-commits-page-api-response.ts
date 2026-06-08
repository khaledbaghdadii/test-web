export interface GetPullRequestCommitsPageApiResponse {
  page: number;
  size: number;
  totalElements: number;
  last: boolean;
  content: GetPullRequestCommitsApiResponse[];
}

interface GetPullRequestCommitsApiResponse {
  id: string;
  authorDisplayName: string;
  authorTimestamp: string;
  message: string;
  url: string;
}
