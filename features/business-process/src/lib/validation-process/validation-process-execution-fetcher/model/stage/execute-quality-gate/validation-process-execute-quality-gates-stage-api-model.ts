import { ValidationProcessStageApiModel } from "../validation-process-stage-api-model";
import { ValidationResultApiModel } from "./validation-result-api-model";

export interface ValidationProcessExecuteQualityGatesStageApiModel
  extends ValidationProcessStageApiModel {
  validationResult: ValidationResultApiModel;
}
