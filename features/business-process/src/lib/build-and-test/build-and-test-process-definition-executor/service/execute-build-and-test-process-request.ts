export interface ExecuteBuildAndTestProcessRequest {
  name: string;
  definitionId: string;
  repositoryId: string;
  configurationBranchName: string;
  configurationParentBranch: string;
  userStoryIds: string[];
  buildEnvironmentInfraGroup: string;
  buildAndTestInfraGroup: string;
  skipPrepareBuildEnvironment: boolean;
  buildEnvironmentScenarioDefinitionId?: string;
  notificationsRecipients?: string[];
}
