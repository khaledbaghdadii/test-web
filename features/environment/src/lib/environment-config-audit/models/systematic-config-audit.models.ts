export interface SystematicConfigAuditOperationsResponse {
  operationId: string;
  environmentId: string;
  targetCommitId: string;
  baselineCommitId?: string;
  requestStatus: RequestStatus;
  requestStatusMessage?: string;
  requestResultStatus?: RequestResultType;
  requestResultMessage?: string;
  configurationLintingResult?: ConfigurationLintingOperationResult;
}

export enum RequestStatus {
  PENDING = "PENDING",
  STARTED = "STARTED",
  ENDED = "ENDED",
  INVALID = "INVALID",
}

export enum RequestResultType {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  TIMEOUT = "TIMEOUT",
  ABORTED = "ABORTED",
}

export type ConfigurationLintingMode = "FULL" | "DELTA";

export type ConfigurationLintingExecutionResultStatus =
  | "PASS"
  | "FAIL"
  | "WARNING";

export interface ConfigurationLintingOperationResult {
  resultStatus: ConfigurationLintingExecutionResultStatus;
  resultMessage?: string;
  artifacts?: string[];
  startTime?: string | Date;
  endTime?: string | Date;
  duration?: string;
  mode: ConfigurationLintingMode;
}
