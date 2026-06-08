export interface InfraResourceSettingsApiRequest {
  infraGroupId: string;
  projectId: string;
  maxNumberOfFailedEnvironmentsToKeep: number;
}
