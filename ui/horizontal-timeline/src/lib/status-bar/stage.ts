import { StageStatus } from "./stage-status";

export interface Stage {
  name: string;
  status: StageStatus;
  startDate?: string;
  endDate?: string;
}
