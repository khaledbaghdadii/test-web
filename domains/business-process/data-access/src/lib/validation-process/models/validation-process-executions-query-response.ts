import { ValidationProcessExecution } from "./validation-process-execution";

export interface ValidationProcessExecutionsQueryResponse {
  executions: ValidationProcessExecution[];
  total: number;
  last: boolean;
}
