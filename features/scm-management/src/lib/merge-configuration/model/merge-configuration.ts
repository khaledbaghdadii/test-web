export interface MergeConfiguration {
  id: string;
  projectId: string;
  branchName: string;
  mergeConfigurationDefinition: SimpleMergeConfigurationDefinition;
}

export interface SimpleMergeConfigurationDefinition {
  id: string;
  repositoryId: string;
  branchPattern: string;
}
