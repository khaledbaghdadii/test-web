import { ValidationProcessExecution } from "./validation-process-execution";

export class ValidationProcessExecutionsQueryResponse {
  executions: ValidationProcessExecution[];
  total: number;
  last: boolean;
}
