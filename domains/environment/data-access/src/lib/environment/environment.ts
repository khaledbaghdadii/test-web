import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

export interface Environment {
  id: string;
  status: EnvironmentStatus;
  projectId: string;
  startDate?: string;
  mxVersion?: string;
  mxBuildId?: string;
  commitId?: string;
  bundles?: EnvironmentBundle[];
  isTools?: EnvironmentIsTool[];
  outputsDirectoryUri?: string;
  databases: EnvironmentDatabase[];
  primaryApplicative?: Applicative;
  secondaryApplicatives?: Applicative[];
  excludeFromShutdown?: boolean;
  environmentActions?: string[];
  webClientUrl?: string;
  secureClientArtifactUri?: string;
  environmentDeploymentMode?: string;
  environmentSource?: string;
  environmentDefinition?: EnvironmentDefinitionRef;
  configurationIdentifier?: EnvironmentConfigurationIdentifier;
  maintenance?: EnvironmentMaintenance;
  allocationId?: string;
  clients?: EnvironmentMachineRef[];
  tests?: EnvironmentMachineRef[];
  clonedRepositoryPath?: string;
}

export interface EnvironmentDefinitionRef {
  id?: string;
  name: string;
}

export interface EnvironmentConfigurationIdentifier {
  branch?: string;
  revision?: string;
}

export interface EnvironmentMaintenance {
  full?: boolean;
}

export interface EnvironmentMachineRef {
  directory?: string;
  allocation?: EnvironmentMachineRefAllocation;
}

export interface EnvironmentMachineRefAllocation {
  machine?: EnvironmentMachineRefMachine;
}

export interface EnvironmentMachineRefMachine {
  name: string;
}

export interface EnvironmentBundle {
  id: string;
  branch: string;
  version: string;
  changelist?: string;
  type?: string;
}

export interface EnvironmentIsTool {
  name: string;
}

export interface EnvironmentDatabase {
  name: string;
  mxDbTypes: string[];
  allocation?: EnvironmentDatabaseAllocation;
}

export interface EnvironmentDatabaseAllocation {
  name?: string;
  port?: string;
  machine?: EnvironmentDatabaseMachine;
}

export interface EnvironmentDatabaseMachine {
  name: string;
}

export interface Applicative {
  allocation: ApplicativeAllocation;
  directory: string;
}

export interface ApplicativeAllocation {
  machine?: ApplicativeMachine;
  ports?: ApplicativePorts;
}

export interface ApplicativeMachine {
  id: string;
  name: string;
}

export interface ApplicativePorts {
  start: number;
  end: number;
}
