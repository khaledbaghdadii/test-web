import { ValidationProcessStageStatus } from "./validation-process-stage-status";

export interface ValidationProcessStage {
  status: ValidationProcessStageStatus;
  name: string;
  startDate: string;
  endDate: string;
  errorMessage: string;
  route: string;
}
