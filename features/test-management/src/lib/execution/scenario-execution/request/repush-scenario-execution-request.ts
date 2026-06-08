export interface RepushScenarioExecutionRequest {
  factoryProductId: string;
  commitId?: string;
  executionGroupId?: string;
  stopServices?: boolean;
}
