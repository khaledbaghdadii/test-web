import { InfraResourceSettingsRequest } from "./infra-resource-settings-create-request";

export interface MergeConfigurationDefinitionUpdateRequest {
  id: string;
  scenarioDefinitionId: string;
  automergeEnabled: boolean;
  automergeTimeout: number;
  automergeBulkEnabled: boolean;
  runFullMaintenance: boolean;
  automergeBulkSize: number;
  deltaConfigImportEnabled: boolean;
  mxLintEnabled: boolean;
  infraResourceSettings: InfraResourceSettingsRequest;
}
