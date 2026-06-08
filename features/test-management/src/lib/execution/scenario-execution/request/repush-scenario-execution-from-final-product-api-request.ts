export interface RepushScenarioExecutionFromFinalProductApiRequest {
  finalProductId: string;
  rtpCommitId: string;
  executionGroupId?: string;
  stopServices?: boolean;
}
