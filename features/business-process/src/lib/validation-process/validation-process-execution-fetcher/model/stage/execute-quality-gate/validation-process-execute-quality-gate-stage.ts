import { ValidationProcessStage } from "../validation-process-stage";
import { ValidationResult } from "./validation-result";

export interface ValidationProcessExecuteQualityGateStage
  extends ValidationProcessStage {
  validationResult: ValidationResult | null;
}
