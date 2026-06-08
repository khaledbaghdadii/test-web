export interface RepushBuildAndTestProcessInput {
  name: string;
  repositoryId: string;
  configurationBranchName: string;
  configurationParentBranch: string;
  userStoryIds: string[];
  buildEnvironmentInfraGroup: string;
  buildAndTestInfraGroup: string;
  skipEnvironmentDeployment: boolean;
  buildScenarioDefinitionId?: string;
  notificationsRecipients?: string[];
}
