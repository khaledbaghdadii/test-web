export interface FinalProductPublishing {
  id: string;
  publishingStartDate: string;
  publishingEndDate?: string;
  finalProductFailure?: string;
}

export const enum FinalProductFailure {
  FAILURE_PRE_PUBLISHING_REQUESTED = "FAILURE_PRE_PUBLISHING_REQUESTED",
}
