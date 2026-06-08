import { ValidationProcessExecutionStageStatus } from "./validation-process-execution-stage-status";

export interface ValidationProcessStage {
  status: ValidationProcessExecutionStageStatus;
  name: string;
  startDate: string;
  endDate: string;
  errorMessage: string;
  route: string;
}
