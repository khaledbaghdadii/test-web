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
