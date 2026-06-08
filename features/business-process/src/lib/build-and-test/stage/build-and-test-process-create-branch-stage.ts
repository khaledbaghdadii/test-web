import { BuildAndTestProcessStage } from "./build-and-test-process-stage";

export interface BuildAndTestProcessCreateBranchStage
  extends BuildAndTestProcessStage {
  createBranch: boolean;
  repositoryId: string;
  developmentId: string;
}
