export interface RepushScenarioExecutionFromFinalProductRequest {
  finalProductId: string;
  rtpCommitId: string;
  executionGroupId?: string;
  stopServices?: boolean;
}
