export interface MergeConfigurationApiResponse {
  id: string;
  projectId: string;
  mergeConfigurationDefinition: SimpleMergeConfigurationDefinitionApiResponse;
  branchName: string;
}

export interface SimpleMergeConfigurationDefinitionApiResponse {
  id: string;
  repositoryId: string;
  branchPattern: string;
}
