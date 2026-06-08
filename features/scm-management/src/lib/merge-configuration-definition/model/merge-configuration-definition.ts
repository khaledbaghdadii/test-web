import { InfraResourceSettings } from "./infra-resource-settings";

export interface MergeConfigurationDefinition {
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
  infraResourceSettings: InfraResourceSettings;
}

export interface Repository {
  id: string;
}
