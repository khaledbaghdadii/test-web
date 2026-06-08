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

export interface MergeRequestStateTransition {
  readonly mergeRequestPreviousState: MergeRequestState;
  readonly mergeRequestCurrentState: MergeRequestState;
  readonly transitionedOn: string;
}

export interface MergeRequestBuild {
  readonly id: string;
  readonly scenarioExecutionId?: string;
  readonly bulkMode: boolean;
}

export const UNSUCCESSFUL_MERGE_REQUEST_END_STATES: ReadonlySet<MergeRequestState> =
  new Set([
    MergeRequestState.DECLINED,
    MergeRequestState.DELETED,
    MergeRequestState.UNDER_VALIDATION_FAILED,
    MergeRequestState.REVIEW_FAILED,
    MergeRequestState.MERGE_FAILED,
  ]);

export interface MergeRequestRepository {
  readonly id: string;
}

export interface MergeRequestDevelopment {
  readonly id: string;
  readonly name: string;
  readonly projectId: string;
  readonly repository: MergeRequestRepository;
}

export interface MergeRequestMergeConfiguration {
  readonly id: string;
  readonly branchName: string;
}

export interface MergeRequestOverview {
  readonly id?: string;
  readonly pullRequestId: string;
  readonly mergeRequestState: MergeRequestState;
  readonly createdOn?: string;
  readonly pullRequestUrl?: string;
  readonly destinationBranch?: string;
  readonly failureReason?: FailureReason;
  readonly mergeRequestPriority?: string;
  readonly queuePosition?: number;
  readonly queuedDate?: string;
  readonly endDate?: string;
  readonly isLastBuildInBulkMode?: boolean;
  readonly development?: MergeRequestDevelopment;
  readonly mergeConfiguration?: MergeRequestMergeConfiguration;
  readonly builds?: MergeRequestBuild[];
  readonly stateTransitions?: MergeRequestStateTransition[];
  readonly owner?: string;
  readonly projectId?: string;
  readonly isReOpenable?: boolean;
}

export interface MergeRequestFilterRequest {
  readonly developmentId: string;
  readonly contextId: string;
}
