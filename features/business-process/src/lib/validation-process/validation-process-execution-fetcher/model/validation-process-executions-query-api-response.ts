import { ValidationProcessExecutionApiModel } from "./validation-process-execution-api-model";

export class ValidationProcessExecutionsQueryApiResponse {
  content: ValidationProcessExecutionApiModel[];
  totalElements: number;
  last: boolean;
}
