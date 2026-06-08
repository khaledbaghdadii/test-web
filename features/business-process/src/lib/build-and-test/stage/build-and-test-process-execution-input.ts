export interface BuildAndTestProcessExecutionInput {
  repositoryId: string;
  configurationBranchName: string;
  configurationParentBranch: string;
  userStoryIds: string[];
  buildAndTestInfraGroup: string;
  buildEnvironmentInfraGroup: string;
  buildEnvironment: BuildAndTestProcessBuildEnvironmentInput;
}

export interface BuildAndTestProcessBuildEnvironmentInput {
  skipEnvironmentDeployment: boolean;
  scenarioDefinitionId: string;
}
