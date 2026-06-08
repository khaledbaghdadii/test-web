export interface BackportInput {
  readonly definitionId: string;
  readonly repositoryId: string;
  readonly mergeConfigurationId: string;
  readonly buildAndTestInfraGroupId: string;
}

export interface SendChangesForReviewRequest {
  readonly projectId: string;
  readonly processId: string;
  readonly mergeJobTitle: string;
  readonly mergeConfigurationId: string;
  readonly mergeJobReviewers: string[];
  readonly backportChanges: boolean;
  readonly backportMergeConfigurationIds?: string[];
  readonly backportInputs?: BackportInput[];
  readonly shouldCleanDevelopment: boolean;
  readonly developmentId: string;
  readonly supportsResourceManagement: boolean;
}

export interface ProceedWithPredefinedInputsRequest {
  readonly projectId: string;
  readonly processId: string;
  readonly shouldCleanDevelopment: boolean;
  readonly developmentId: string;
  readonly supportsResourceManagement: boolean;
}

export interface ReopenMergeRequestRequest {
  readonly projectId: string;
  readonly processId: string;
  readonly title?: string;
  readonly reviewers?: string[];
}

export interface CommitsCherryPickedRequest {
  readonly projectId: string;
  readonly processId: string;
  readonly mergeConfigurationId: string;
}

export interface RepushBackportMergeRequest {
  readonly projectId: string;
  readonly processId: string;
  readonly mergeConfigurationId: string;
}
