import { QualityGateValidationDecision } from "@mxevolve/domains/business-process/util";

export interface ValidationResult {
  requester: string;
  decision: QualityGateValidationDecision;
  comment: string;
}
