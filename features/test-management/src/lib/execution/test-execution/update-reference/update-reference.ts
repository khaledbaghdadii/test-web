export interface UpdateReference {
  id: string;
  projectId: string;
  testExecutionId: string;
  path: string;
  commitMessage: string;
  status: UpdateReferenceStatus;
  commitId: string;
  linkedConfigurationImpactsIds: Set<string>;
  linkedBinaryImpactsIds: Set<string>;
}

export enum UpdateReferenceStatus {
  QUEUED = "QUEUED",
  UNDERWAY = "UNDERWAY",
  PASSED = "PASSED",
  FAILED = "FAILED",
}
