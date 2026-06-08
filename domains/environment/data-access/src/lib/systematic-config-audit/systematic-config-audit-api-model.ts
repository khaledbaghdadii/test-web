/**
 * Raw wire shape returned by
 * GET {gateway}projects/{projectId}/environments/{environmentId}/systematic-config-audit
 */
export interface SystematicConfigAuditOperationsResponseApiModel {
  operationId: string;
  environmentId: string;
  targetCommitId: string;
  baselineCommitId?: string;
  requestStatus: string;
  requestStatusMessage?: string;
  requestResultStatus?: string;
  requestResultMessage?: string;
  configurationLintingResult?: ConfigurationLintingOperationResultApiModel;
}

export interface ConfigurationLintingOperationResultApiModel {
  resultStatus: string;
  resultMessage?: string;
  artifacts?: string[];
  startTime?: string;
  endTime?: string;
  duration?: string;
  mode: string;
}
