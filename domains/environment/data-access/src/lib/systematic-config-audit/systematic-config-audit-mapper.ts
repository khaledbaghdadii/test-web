import {
  ConfigurationLintingOperationResultApiModel,
  SystematicConfigAuditOperationsResponseApiModel,
} from "./systematic-config-audit-api-model";
import {
  ConfigurationLintingMode,
  ConfigurationLintingOperationResult,
  ConfigurationLintingResultStatus,
  SystematicConfigAuditOperationsResponse,
  SystematicConfigAuditRequestResultType,
  SystematicConfigAuditRequestStatus,
} from "./systematic-config-audit";

export function toSystematicConfigAuditOperationsResponse(
  apiModel: SystematicConfigAuditOperationsResponseApiModel
): SystematicConfigAuditOperationsResponse {
  return {
    operationId: apiModel.operationId,
    environmentId: apiModel.environmentId,
    targetCommitId: apiModel.targetCommitId,
    baselineCommitId: apiModel.baselineCommitId,
    requestStatus: apiModel.requestStatus as SystematicConfigAuditRequestStatus,
    requestStatusMessage: apiModel.requestStatusMessage,
    requestResultStatus: apiModel.requestResultStatus as
      | SystematicConfigAuditRequestResultType
      | undefined,
    requestResultMessage: apiModel.requestResultMessage,
    configurationLintingResult: apiModel.configurationLintingResult
      ? toConfigurationLintingOperationResult(
          apiModel.configurationLintingResult
        )
      : undefined,
  };
}

function toConfigurationLintingOperationResult(
  apiModel: ConfigurationLintingOperationResultApiModel
): ConfigurationLintingOperationResult {
  return {
    resultStatus: apiModel.resultStatus as ConfigurationLintingResultStatus,
    resultMessage: apiModel.resultMessage,
    artifacts: apiModel.artifacts ?? [],
    startTime: apiModel.startTime,
    endTime: apiModel.endTime,
    duration: apiModel.duration,
    mode: apiModel.mode as ConfigurationLintingMode,
  };
}
