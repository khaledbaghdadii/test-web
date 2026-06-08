import { QualityGateValidationDecision } from "@mxflow/features/business-process";

export interface ValidationResult {
  requester: string;
  decision: QualityGateValidationDecision;
  comment: string;
}
