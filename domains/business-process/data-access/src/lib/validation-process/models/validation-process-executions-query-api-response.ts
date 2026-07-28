import { ValidationProcessExecutionApiModel } from "./validation-process-execution-api-model";

export interface ValidationProcessExecutionsQueryApiResponse {
  content: ValidationProcessExecutionApiModel[];
  totalElements: number;
  last: boolean;
}
