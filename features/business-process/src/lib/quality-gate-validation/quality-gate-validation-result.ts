export enum QualityGateValidationDecision {
  PASSED = "VALIDATION_PASSED",
  FAILED = "FAILED_AND_STOP_THE_PROCESS",
}

export interface QualityGateValidationResult {
  decision: QualityGateValidationDecision;
  comment?: string;
  requester?: string;
}
