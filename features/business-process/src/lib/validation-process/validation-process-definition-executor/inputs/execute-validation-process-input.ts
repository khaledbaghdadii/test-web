export interface ExecuteValidationProcessInput {
  name: string;
  official: boolean;
  notificationsRecipients?: string[];
  repositoryId: string;
  businessProcessQualityLevel: string;
  createBranch: boolean;
  parentBranchName: string;
  archivalBranchName: string;
  configCommitId: string;
  rtpCommitId: string;
  finalProductId: string;
  qualityGateScenarioDefinitionIds: string[];
  nightlyRepusherEnabled: boolean;
  qualityGateInfraGroupId: string;
  validationScopeStartCommitId: string;
}
