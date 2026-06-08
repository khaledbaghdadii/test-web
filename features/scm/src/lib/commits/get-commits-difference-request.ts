export interface GetCommitsDifferenceRequest {
  projectId: string;
  repositoryId: string;
  sourceBranch: string;
  destinationBranch: string;

}
