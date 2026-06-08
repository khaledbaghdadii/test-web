import { EnvironmentStatus } from "../../environment-status/environment-status";
import {
  ClonedRepository,
  EnvironmentAction,
  EnvironmentDeploymentMode,
  EnvironmentSource,
  MaintenanceConfiguration,
} from "./environment.model";

export interface EnvironmentApiModel {
  id: string;
  projectId: string;
  status: EnvironmentStatus;
  definitionId: string;
  primaryApplicative?: EnvironmentApplicationApiModel;
  secondaryApplicatives?: EnvironmentApplicationApiModel[];
  databases: EnvironmentDatabaseApiModel[];
  tests: EnvironmentTestApiModel[];
  configurationIdentifier: ConfigurationIdentifierApiModel;
  outputsDirectoryUri: string;
  bundles: BundleApiModel[];
  isTools: IsToolApiModel[];
  clonedRepositoryPath?: string;
  clonedRepository?: ClonedRepository;
  clients: EnvironmentClientApiModel[];
  allocationId?: string;
  createdOn: string;
  createdBy: string;
  environmentDefinition?: EnvironmentDefinitionSummaryApiModel;
  maintenance: MaintenanceConfiguration;
  environmentActions?: EnvironmentAction[];
  secureClientArtifactUri?: string;
  webClientUrl?: string;
  environmentDeploymentMode?: EnvironmentDeploymentMode;
  environmentSource?: EnvironmentSource;
  excludeFromShutdown?: boolean;
  configurationEditorProperties?: ConfigurationEditorPropertiesApiModel;
  clientRepositoryConfiguration?: ClientRepositoryConfigurationApiModel;
  configurationRepository?: ConfigurationRepositoryApiModel;
  parentResources?: ParentResourceApiModel[];
}

export interface ConfigurationRepositoryApiModel {
  id: string;
}

interface ParentResourceApiModel {
  id: string;
  type: string;
}

export interface ClientRepositoryConfigurationApiModel {
  test?: TestRepositoryConfigurationApiModel;
}

export interface TestRepositoryConfigurationApiModel {
  directory: string;
}

export interface EnvironmentDefinitionSummaryApiModel {
  name: string;
  id: string;
}

interface TestConfigurationApplicationPropertiesApiModel {
  url: string;
}

export interface ConfigurationEditorPropertiesApiModel {
  disabled: boolean;
  testConfigurationApplication?: TestConfigurationApplicationPropertiesApiModel;
}

interface EnvironmentClientApiModel {
  directory: string;
  allocation: ClientAllocationApiModel;
}

interface ConfigurationIdentifierApiModel {
  branch: string;
  revision: string;
}

interface EnvironmentApplicationApiModel {
  directory: string;
  allocation: ApplicationAllocationApiModel;
}

interface EnvironmentDatabaseApiModel {
  name: string;
  allocation: DatabaseAllocationApiModel;
  mxDbTypes?: string[];
}

interface EnvironmentTestApiModel {
  directory: string;
  allocation: TestAllocationApi;
}

interface ClientAllocationApiModel {
  machine: MachineApiModel;
}

interface TestAllocationApi {
  machine: MachineApiModel;
}

interface DatabaseAllocationApiModel {
  name: string;
  port: string;
  machine: MachineApiModel;
}

interface MachineApiModel {
  name: string;
}

interface PortsTemplateApiModel {
  start: number;
  end: number;
}

export interface ApplicationAllocationApiModel {
  ports?: PortsTemplateApiModel;
  machine?: MachineApiModel;
}

interface BundleApiModel {
  id: string;
  version: string;
  branch: string;
  changelist: string;
}

interface IsToolApiModel {
  name: string;
}
