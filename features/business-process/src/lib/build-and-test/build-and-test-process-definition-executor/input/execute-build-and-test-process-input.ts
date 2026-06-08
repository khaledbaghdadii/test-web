export interface ExecuteBuildAndTestProcessInput {
  name: string;
  repositoryId: string;
  configurationBranchName: string;
  configurationParentBranch: string;
  userStoryIds: string[];
  buildEnvironmentInfraGroup: string;
  buildAndTestInfraGroup: string;
  skipPrepareBuildEnvironment: boolean;
  buildScenarioDefinitionId?: string;
  notificationsRecipients?: string[];
}
