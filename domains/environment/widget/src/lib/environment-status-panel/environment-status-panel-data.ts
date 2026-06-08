import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import {
  EnvironmentBundle,
  EnvironmentDatabase,
  EnvironmentIsTool,
  Applicative,
} from "@mxevolve/domains/environment/data-access";

export interface EnvironmentStatusPanelData {
  environmentId: string;
  projectId: string;
  status: EnvironmentStatus;
  deploymentStartDate?: string;
  deploymentEndDate?: string;
  terminationMessage?: string;
  outputsDirectoryUri?: string;
  bundles?: EnvironmentBundle[];
  isTools?: EnvironmentIsTool[];
  databases: EnvironmentDatabase[];
  primaryApplicative?: Applicative;
  secondaryApplicatives?: Applicative[];
  excludeFromShutdown?: boolean;
  environmentActions?: string[];
  webClientUrl?: string;
  secureClientArtifactUri?: string;
}
