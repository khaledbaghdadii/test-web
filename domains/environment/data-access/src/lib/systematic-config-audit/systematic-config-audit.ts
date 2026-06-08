export enum SystematicConfigAuditRequestStatus {
  PENDING = "PENDING",
  STARTED = "STARTED",
  ENDED = "ENDED",
  INVALID = "INVALID",
}

export enum SystematicConfigAuditRequestResultType {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  TIMEOUT = "TIMEOUT",
  ABORTED = "ABORTED",
}

export type ConfigurationLintingMode = "FULL" | "DELTA";

export type ConfigurationLintingResultStatus = "PASS" | "FAIL" | "WARNING";

export interface ConfigurationLintingOperationResult {
  resultStatus: ConfigurationLintingResultStatus;
  resultMessage?: string;
  artifacts: string[];
  startTime?: string;
  endTime?: string;
  duration?: string;
  mode: ConfigurationLintingMode;
}

export interface SystematicConfigAuditOperationsResponse {
  operationId: string;
  environmentId: string;
  targetCommitId: string;
  baselineCommitId?: string;
  requestStatus: SystematicConfigAuditRequestStatus;
  requestStatusMessage?: string;
  requestResultStatus?: SystematicConfigAuditRequestResultType;
  requestResultMessage?: string;
  configurationLintingResult?: ConfigurationLintingOperationResult;
}
