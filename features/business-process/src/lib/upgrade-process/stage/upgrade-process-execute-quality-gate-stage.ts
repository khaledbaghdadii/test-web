import { UpgradeProcessStage } from "./upgrade-process-stage";
import { QualityGateValidationResult } from "../../quality-gate-validation/quality-gate-validation-result";

export interface UpgradeProcessExecuteQualityGateStage
  extends UpgradeProcessStage {
  validationResult?: QualityGateValidationResult;
  keptResourcesDecisionMade?: boolean;
}
