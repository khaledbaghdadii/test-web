export interface ProceedWithPredefinedInputsRequest {
  projectId: string;
  ciProcessExecutionId: string;
  shouldCleanDevelopment: boolean | null;
  developmentId?: string;
  supportsResourceManagement: boolean | null;
}
