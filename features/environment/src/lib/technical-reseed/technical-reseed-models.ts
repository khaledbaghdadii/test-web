import { MaintenanceConfiguration } from "@mxflow/features/environment";

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
  status: TechnicalReseedStatusEnum;
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

export enum TechnicalReseedStatusEnum {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  PASSED = "PASSED",
  FAILED = "FAILED",
  ABORTED = "ABORTED",
}

export interface TechnicalReseedOperationDetails {
  id: string;
  status: TechnicalReseedStatusEnum;
  branch: string;
  sourceCommit: string;
  validationLevel?: string;
  maintenanceLevel: string;
  dumpIds?: string[];
  environmentDefinitionId: string;
  environmentDefinitionName: string;
  environmentId?: string;
  createdOn: string;
  resultMessage?: string;
  progressMessage?: string;
  statusTagIcon: string;
  statusTagSeverity: "success" | "secondary" | "info" | "warn" | "danger";
  isContainerCollapsed: boolean;
}

type StatusItem = {
  status: TechnicalReseedStatusEnum;
  severity: "success" | "secondary" | "info" | "warn" | "danger";
  icon: string;
};

export const STATUS_CONFIGURATION: readonly StatusItem[] = [
  {
    status: TechnicalReseedStatusEnum.PENDING,
    severity: "secondary",
    icon: "pi pi-pause",
  },
  {
    status: TechnicalReseedStatusEnum.RUNNING,
    severity: "info",
    icon: "pi pi-spinner pi-spin",
  },
  {
    status: TechnicalReseedStatusEnum.PASSED,
    severity: "success",
    icon: "pi pi-check",
  },
  {
    status: TechnicalReseedStatusEnum.FAILED,
    severity: "danger",
    icon: "pi pi-times",
  },
  {
    status: TechnicalReseedStatusEnum.ABORTED,
    severity: "warn",
    icon: "pi pi-exclamation-triangle",
  },
];
