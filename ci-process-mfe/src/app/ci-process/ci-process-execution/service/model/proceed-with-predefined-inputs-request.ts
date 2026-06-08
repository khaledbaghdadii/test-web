export interface ProceedWithPredefinedInputsRequest {
  projectId: string;
  ciProcessExecutionId: string;
  shouldCleanDevelopment: boolean;
  developmentId: string;
  supportsResourceManagement: boolean;
}
