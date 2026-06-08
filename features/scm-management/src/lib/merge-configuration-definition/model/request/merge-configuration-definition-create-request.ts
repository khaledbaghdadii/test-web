import { InfraResourceSettingsRequest } from "./infra-resource-settings-create-request";
export interface MergeConfigurationDefinitionCreateRequest {
  repositoryId: string;
  branchPattern: string;
  scenarioDefinitionId: string;
  automergeEnabled: boolean;
  automergeTimeout: number;
  automergeBulkEnabled: boolean;
  automergeBulkSize: number;
  runFullMaintenance?: boolean;
  deltaConfigImportEnabled: boolean;
  infraResourceSettings: InfraResourceSettingsRequest;
}
