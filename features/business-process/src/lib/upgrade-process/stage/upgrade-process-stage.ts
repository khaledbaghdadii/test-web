import { StageStatus } from "@mxevolve/domains/business-process/util";

export interface UpgradeProcessStage {
  name: string;
  status: StageStatus;
  startDate?: string;
  endDate?: string;
  route: string;
  errorMessage?: string;
}
