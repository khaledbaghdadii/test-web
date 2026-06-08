export enum MergeRequestState {
  IN_REVIEW = "IN_REVIEW",
  QUEUED = "QUEUED",
  UNDER_VALIDATION = "UNDER_VALIDATION",
  MERGED = "MERGED",
  REVIEW_FAILED = "REVIEW_FAILED",
  UNDER_VALIDATION_FAILED = "UNDER_VALIDATION_FAILED",
  MERGE_FAILED = "MERGE_FAILED",
  DECLINED = "DECLINED",
  DELETED = "DELETED",
  IN_REVIEW_NOT_MERGEABLE = "IN_REVIEW_NOT_MERGEABLE",
}

export enum MergeRequestStatus {
  IN_PROGRESS,
  SUCCESS,
  FAILED,
}

export enum MergeRequestPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum FailureReason {
  PR_UNAPPROVED = "PR_UNAPPROVED",
  PR_DELETED = "PR_DELETED",
  REBASE_CONFLICT = "REBASE_CONFLICT",
  TECHNICAL_FAILURE = "TECHNICAL_FAILURE",
  CQG_FAILURE = "CQG_FAILURE",
  PR_NOT_MERGEABLE = "PR_NOT_MERGEABLE",
  PR_MERGED = "PR_MERGED",
  MERGE_REQUEST_NOT_FOUND = "MERGE_REQUEST_NOT_FOUND",
  SCENARIO_EXECUTION_TIMEOUT = "SCENARIO_EXECUTION_TIMEOUT",
  PR_DECLINED = "PR_DECLINED",
}

export enum MergeRequestProcessingMode {
  BULK = "BULK",
  SEQUENTIAL = "SEQUENTIAL",
}

export interface MergeRequestReviewer {
  displayName: string;
  name: string;
}

export interface MergeRequest {
  id: string;
  projectId: string;
  title: string;
  development: {
    id: string;
    name: string;
    projectId: string;
    repositoryId: string;
  };
  mergeConfiguration: {
    id: string;
    projectId: string;
    branchName: string;
  };
  businessProcess: {
    id: string;
    name: string;
  };
  contextId?: string;
  owner?: string;
  pullRequestId: string;
  pullRequestUrl: string;
  mergeRequestStatus: MergeRequestStatus;
  mergeRequestState: MergeRequestState;
  mergeRequestPriority: MergeRequestPriority;
  queuedDate?: Date;
  failureReason?: FailureReason;
  endDate?: Date;
  createdOn?: Date;
  createdBy?: string;
  queuePosition?: number;
  isLastBuildInBulkMode?: boolean;
  processingModeForNextRun?: MergeRequestProcessingMode;
  isReOpenable?: boolean;
  reviewers: MergeRequestReviewer[];
}
