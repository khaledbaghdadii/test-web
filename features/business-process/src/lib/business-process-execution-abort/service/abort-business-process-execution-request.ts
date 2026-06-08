export interface AbortBusinessProcessExecutionRequest {
  projectId: string;
  processId: string;
  shouldCleanDevelopment: boolean;
  developmentId?: string;
}
