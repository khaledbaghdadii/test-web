export interface MaintenanceConfiguration {
  full: boolean;
}

export interface FinalProductReseedDetails {
  branch: string;
  configurationCommitId: string;
  validationLevel?: string;
}

export interface LaunchTechnicalReseedOperationRequest {
  infraGroupId: string;
  branch: string;
  configurationCommitId: string;
  environmentDefinitionId: string;
  maintenanceConfiguration: MaintenanceConfiguration;
  validationLevel?: string;
  targetBranch: string;
}

export interface LaunchTechnicalReseedOperationResponse {
  requestId: string;
}

export interface TechnicalReseedOperation {
  id: string;
  status: TechnicalReseedStatus;
  branch: string;
  sourceCommit: string;
  validationLevel?: string;
  maintenanceLevel: string;
  environmentDefinitionId: string;
  dumpIds?: string[];
  environmentId?: string;
  createdOn: string;
  resultMessage?: string;
  progressMessage?: string;
}

export enum TechnicalReseedStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  PASSED = "PASSED",
  FAILED = "FAILED",
  ABORTED = "ABORTED",
}

export interface TechnicalReseedExecutionGroup {
  executionGroupId: string;
  status: TechnicalReseedExecutionGroupStatus;
  launchesAllowed: boolean;
  reason?: string;
  technicalReseedOperations?: TechnicalReseedOperation[];
}

export enum TechnicalReseedExecutionGroupStatus {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
  CLOSING = "CLOSING",
  CLOSED = "CLOSED",
}

export type TechnicalReseedStatusSeverity =
  | "success"
  | "secondary"
  | "info"
  | "warn"
  | "danger";

export const TECHNICAL_RESEED_STATUS_CONFIGURATION: Record<
  TechnicalReseedStatus,
  { severity: TechnicalReseedStatusSeverity; icon: string }
> = {
  [TechnicalReseedStatus.PENDING]: {
    severity: "secondary",
    icon: "pi pi-pause",
  },
  [TechnicalReseedStatus.RUNNING]: {
    severity: "info",
    icon: "pi pi-spinner pi-spin",
  },
  [TechnicalReseedStatus.PASSED]: {
    severity: "success",
    icon: "pi pi-check",
  },
  [TechnicalReseedStatus.FAILED]: {
    severity: "danger",
    icon: "pi pi-times",
  },
  [TechnicalReseedStatus.ABORTED]: {
    severity: "warn",
    icon: "pi pi-exclamation-triangle",
  },
};
