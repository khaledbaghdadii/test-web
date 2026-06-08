import { BuildAndTestProcessStageStatus } from "./build-and-test-process-stage-status";

export interface BuildAndTestProcessStage {
  name: string;
  status: BuildAndTestProcessStageStatus;
  startDate?: string;
  endDate?: string;
  route: string;
  errorMessage?: string;
}
