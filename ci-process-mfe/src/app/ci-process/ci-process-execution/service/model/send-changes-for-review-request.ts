import { BackportInput } from "./backport-input";

export interface SendChangesForReviewRequest {
  projectId: string;
  ciProcessExecutionId: string;
  mergeJobTitle: string;
  mergeConfigurationId: string;
  mergeJobReviewers: string[];
  backportChanges: boolean;
  backportMergeConfigurationIds?: string[];
  backportInputs?: BackportInput[];
  shouldCleanDevelopment: boolean;
  developmentId: string;
  supportsResourceManagement: boolean;
}
