import {
  FailureReason,
  MergeRequestPriority,
  MergeRequestProcessingMode,
  MergeRequestState,
  MergeRequestStatus,
} from "../merge-request";

export interface MergeRequestReviewer {
  displayName: string;
  name: string;
}

export interface MergeRequestApiResponse {
  id: string;
  projectId: string;
  title: string;
  development: {
    id: string;
    name: string;
    projectId: string;
    repositoryId: string;
  };
  businessProcess: {
    id: string;
    name: string;
  };
  mergeConfiguration: {
    id: string;
    projectId: string;
    branchName: string;
  };
  contextId?: string;
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
