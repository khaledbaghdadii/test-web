export interface ReopenMergeRequestRequest {
  projectId: string;
  ciProcessExecutionId: string;
  title?: string;
  reviewers?: string[];
}
