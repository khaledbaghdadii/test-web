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
}

export interface EnvironmentBundle {
  id: string;
  branch: string;
  version: string;
  type?: string;
}

export interface EnvironmentIsTool {
  name: string;
}

export interface EnvironmentDatabase {
  name: string;
  mxDbTypes: string[];
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
