import { InfraResourceSettingsApiRequest } from "./infra-resource-settings-api-create-request";

export interface MergeConfigurationDefinitionApiCreateRequest {
  repositoryId: string;
  branchPattern: string;
  scenarioDefinitionId: string;
  automergeEnabled: boolean;
  automergeTimeout: number;
  automergeBulkEnabled: boolean;
  automergeBulkSize: number;
  runFullMaintenance?: boolean;
  deltaConfigImportEnabled: boolean;
  infraResourceSettings: InfraResourceSettingsApiRequest;
}
