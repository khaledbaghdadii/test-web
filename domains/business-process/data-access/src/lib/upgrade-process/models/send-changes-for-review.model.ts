export interface SendChangesForReviewRequest {
  projectId: string;
  processId: string;
  mergeJobTitle: string;
  mergeConfigurationId: string;
  mergeJobReviewers: string[];
  shouldCleanDevelopment: boolean;
  developmentId?: string;
  supportsResourceManagement: boolean;
}
