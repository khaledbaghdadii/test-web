import { InfraResourceSettingsApiResponse } from "./infra-resource-settings-api-response";

export interface Repository {
  id: string;
}

export interface MergeConfigurationDefinitionApiResponse {
  id: string;
  projectId: string;
  repository: Repository;
  branchPattern: string;
  scenarioDefinitionId: string;
  automergeEnabled: boolean;
  automergeTimeout: number;
  automergeBulkEnabled: boolean;
  runFullMaintenance: boolean;
  automergeBulkSize: number;
  deltaConfigImportEnabled: boolean;
  infraResourceSettings: InfraResourceSettingsApiResponse;
}
