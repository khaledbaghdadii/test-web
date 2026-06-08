export interface Reviewer {
  name: string;
  displayName: string;
}

export interface DefaultReviewer {
  name: string;
  displayName: string;
}

export interface DefaultReviewersResponse {
  content: DefaultReviewer[];
}

export interface ReviewersResponse {
  content: Reviewer[];
  totalElements: number;
  page: number;
  last: boolean;
}

export interface GetDefaultReviewersRequest {
  projectId: string;
  repositoryId: string;
  sourceBranch: string;
  targetBranch: string;
}

export interface GetReviewersRequest {
  projectId: string;
  repositoryId: string;
  page: number;
  size: number;
  filter: string;
}
