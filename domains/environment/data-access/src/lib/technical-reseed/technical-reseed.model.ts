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
  pauseForManualIntervention?: boolean;
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
  PENDING_INPUT = "PENDING_INPUT",
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
    icon: "pi pi-pause-circle",
  },
  [TechnicalReseedStatus.RUNNING]: {
    severity: "info",
    icon: "pi pi-spinner pi-spin",
  },
  [TechnicalReseedStatus.PASSED]: {
    severity: "success",
    icon: "pi pi-check-circle",
  },
  [TechnicalReseedStatus.FAILED]: {
    severity: "danger",
    icon: "pi pi-times-circle",
  },
  [TechnicalReseedStatus.ABORTED]: {
    severity: "warn",
    icon: "pi pi-exclamation-circle",
  },
  [TechnicalReseedStatus.PENDING_INPUT]: {
    severity: "warn",
    icon: "pi pi-pause-circle",
  },
};
