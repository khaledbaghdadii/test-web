export interface EnvironmentPageApiModel {
  content: EnvironmentApiModel[];
  totalElements: number;
}

export interface EnvironmentApiModel {
  id: string;
  status: string;
  projectId: string;
  createdOn: string;
  bundles?: EnvironmentBundleApiModel[];
  isTools?: EnvironmentIsToolApiModel[];
  configurationIdentifier?: EnvironmentConfigurationIdentifierApiModel;
  outputsDirectoryUri?: string;
  databases?: EnvironmentDatabaseApiModel[];
  primaryApplicative?: ApplicativeApiModel;
  secondaryApplicatives?: ApplicativeApiModel[];
  excludeFromShutdown?: boolean;
  environmentActions?: string[];
  webClientUrl?: string;
  secureClientArtifactUri?: string;
  environmentDeploymentMode?: string;
  environmentSource?: string;
  environmentDefinition?: EnvironmentDefinitionApiModel;
  maintenance?: EnvironmentMaintenanceApiModel;
  allocationId?: string;
  clients?: EnvironmentMachineRefApiModel[];
  tests?: EnvironmentMachineRefApiModel[];
  clonedRepositoryPath?: string;
}

export interface EnvironmentDefinitionApiModel {
  id?: string;
  name: string;
}

export interface EnvironmentMaintenanceApiModel {
  full?: boolean;
}

export interface EnvironmentMachineRefApiModel {
  directory?: string;
  allocation?: EnvironmentMachineRefAllocationApiModel;
}

export interface EnvironmentMachineRefAllocationApiModel {
  machine?: EnvironmentMachineRefMachineApiModel;
}

export interface EnvironmentMachineRefMachineApiModel {
  name: string;
}

export interface EnvironmentDatabaseApiModel {
  name: string;
  allocation: DatabaseAllocationApiModel;
  mxDbTypes?: string[];
}

export interface DatabaseAllocationApiModel {
  name: string;
  port: string;
  machine: DatabaseMachineApiModel;
}

export interface DatabaseMachineApiModel {
  name: string;
}

export interface EnvironmentBundleApiModel {
  id: string;
  branch: string;
  version: string;
  changelist?: string;
}

export interface EnvironmentIsToolApiModel {
  name: string;
}

export interface EnvironmentConfigurationIdentifierApiModel {
  branch: string;
  revision: string;
}

export interface ApplicativeApiModel {
  allocation: ApplicativeAllocationApiModel;
  directory: string;
}

export interface ApplicativeAllocationApiModel {
  machine?: ApplicativeMachineApiModel;
  ports?: ApplicativePortsApiModel;
}

export interface ApplicativeMachineApiModel {
  id: string;
  name: string;
}

export interface ApplicativePortsApiModel {
  start: number;
  end: number;
}
