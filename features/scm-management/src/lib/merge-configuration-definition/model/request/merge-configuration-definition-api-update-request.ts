import { InfraResourceSettingsApiRequest } from "./infra-resource-settings-api-create-request";

export interface MergeConfigurationDefinitionApiUpdateRequest {
  scenarioDefinitionId: string;
  automergeEnabled: boolean;
  automergeTimeout: number;
  automergeBulkEnabled: boolean;
  runFullMaintenance: boolean;
  automergeBulkSize: number;
  deltaConfigImportEnabled: boolean;
  infraResourceSettings: InfraResourceSettingsApiRequest;
}
