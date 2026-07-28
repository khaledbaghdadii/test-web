export interface ValidationProcessExecutionInput {
  repositoryId: string;
  createBranch: boolean;
  archivalBranchName: string;
  parentBranch: string;
  scenarioDefinitionIds: string[];
  businessProcessQualityLevel: string;
  finalProductId: string;
  qualityGateExecutionInfraGroupId: string;
  configCommitId: string;
  rtpCommitId: string;
  nightlyRepusherEnabled: boolean;
  validationScopeStartCommitId?: string | null;
}
