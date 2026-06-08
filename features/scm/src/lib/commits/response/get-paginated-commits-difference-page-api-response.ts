export interface GetPaginatedCommitsDifferencePageApiResponse {
  page: number;
  size: number;
  totalElements: number;
  last: boolean;
  content: GetPaginatedCommitsDifferenceApiResponse[];
}

interface GetPaginatedCommitsDifferenceApiResponse {
  id: string;
  committerDisplayName: string;
  timeStamp: string;
  message: string;
  url: string;
}
