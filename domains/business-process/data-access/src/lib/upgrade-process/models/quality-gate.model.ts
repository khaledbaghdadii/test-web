export interface MarkQualityGateFailedRequest {
  projectId: string;
  processId: string;
  shouldCleanDevelopment: boolean;
  developmentId?: string;
  comment?: string;
  supportsResourceManagement: boolean;
}
