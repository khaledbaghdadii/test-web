import { EnvironmentStatus } from "../../environment-status/environment-status";
import { SafeResourceUrl } from "@angular/platform-browser";

export interface Page<T> {
  content: T[];
  totalElements: number;
  pageable: Pageable;
}

export interface Pageable {
  pageNumber: number;
}

export interface Environment {
  id: string;
  projectId: string;
  status: EnvironmentStatus;
  configurationIdentifier: ConfigurationIdentifier;
  outputsDirectoryUri: string;
  primaryApplicative?: EnvironmentApplicationApiModel;
  secondaryApplicatives?: EnvironmentApplicationApiModel[];
  tests: EnvironmentTestApiModel[];
  bundles: BundleModel[];
  isTools: IsToolModel[];
  clonedRepositoryPath?: string;
  clonedRepository?: ClonedRepository;
  databases?: EnvironmentDatabaseApiModel[];
  clients: EnvironmentClientApiModel[];
  allocationId?: string;
  maintenance: MaintenanceConfiguration;
  createdOn: string;
  createdBy: string;
  environmentDefinition?: EnvironmentDefinitionSummary;
  environmentActions?: EnvironmentAction[];
  secureClientArtifactUri?: string;
  webClientUrl?: string;
  environmentDeploymentMode?: EnvironmentDeploymentMode;
  environmentSource?: EnvironmentSource;
  excludeFromShutdown?: boolean;
  configurationEditorProperties?: ConfigurationEditorProperties;
  clientRepositoryConfiguration?: ClientRepositoryConfiguration;
  configurationRepository?: ConfigurationRepository;
  parentResources?: ParentResource[];
}

export interface ConfigurationRepository {
  id: string;
}

export interface ParentResource {
  id: string;
  type: string;
}

export interface ClientRepositoryConfiguration {
  test?: TestRepositoryConfiguration;
}

export interface TestRepositoryConfiguration {
  directory: string;
}

export interface EnvironmentDefinitionSummary {
  name: string;
  id: string;
}

export enum EnvironmentAction {
  MONITOR_SERVICES = "MONITOR_SERVICES",
  SECURE_CLIENT = "SECURE_CLIENT",
  CLIENT = "CLIENT",
  WEB_CLIENT = "WEB_CLIENT",
}

interface EnvironmentClientApiModel {
  directory: string;
  allocation: ClientAllocationApiModel;
}

interface EnvironmentDatabaseApiModel {
  name: string;
  allocation: DatabaseAllocationApiModel;
  mxDbTypes?: string[];
}

export interface ClonedRepository {
  id: string;
}

export interface MaintenanceConfiguration {
  full: boolean;
}

interface TestConfigurationApplicationProperties {
  url: SafeResourceUrl;
}

export interface ConfigurationEditorProperties {
  disabled: boolean;
  testConfigurationApplication?: TestConfigurationApplicationProperties;
}

interface ClientAllocationApiModel {
  machine: MachineApiModel;
}

interface DatabaseAllocationApiModel {
  name: string;
  port: string;
  machine: MachineApiModel;
}

interface EnvironmentApplicationApiModel {
  directory: string;
  allocation: ApplicationAllocation;
}

interface EnvironmentTestApiModel {
  directory: string;
  allocation?: TestAllocationApi;
}

export interface TestAllocationApi {
  machine?: MachineApiModel;
}

interface ApplicationAllocation {
  ports?: PortsTemplate;
  machine?: MachineApiModel;
}

interface MachineApiModel {
  name: string;
  id?: string;
}

export interface PortsTemplate {
  start: number;
  end: number;
}

export interface BundleModel {
  id: string;
  version: string;
  branch: string;
  changelist: string;
  type?: string;
}

export interface IsToolModel {
  name: string;
}

interface ConfigurationIdentifier {
  branch?: string;
  revision?: string;
}

export enum EnvironmentDeploymentMode {
  VANILLA = "VANILLA",
  DB_SNAPSHOT_FROM_DUMPS = "DB_SNAPSHOT_FROM_DUMPS",
  ENVIRONMENT_SNAPSHOT = "ENVIRONMENT_SNAPSHOT",
  DB_SNAPSHOT_FROM_ENVIRONMENT_SNAPSHOT = "DB_SNAPSHOT_FROM_ENVIRONMENT_SNAPSHOT",
  DUMPS_FROM_ENVIRONMENT_SNAPSHOT = "DUMPS_FROM_ENVIRONMENT_SNAPSHOT",
}

export enum EnvironmentSource {
  POOL = "POOL",
}
