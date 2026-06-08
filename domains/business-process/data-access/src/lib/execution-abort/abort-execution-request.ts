export interface AbortExecutionRequest {
  projectId: string;
  processId: string;
  shouldCleanDevelopment: boolean;
  developmentId?: string;
}
