export interface RerunFromFinalProductRequest {
  finalProductId: string;
  rtpCommitId: string;
  executionGroupId?: string;
  stopServices?: boolean;
}
