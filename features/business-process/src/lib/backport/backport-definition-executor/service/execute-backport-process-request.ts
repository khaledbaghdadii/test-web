export interface ExecuteBackportProcessRequest {
  name: string;
  definitionId: string;
  repositoryId: string;
  destinationMergeConfigurationId: string;
  pullRequestToBeBackported: string;
  pullRequestTitle: string;
  pullRequestReviewers: string[];
  userStoryIds: string[];
  buildAndTestInfraGroup: string;
  notificationsRecipients?: string[];
}
