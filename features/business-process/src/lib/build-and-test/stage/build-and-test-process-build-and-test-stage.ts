import { BuildAndTestProcessStage } from "./build-and-test-process-stage";

export interface BuildAndTestProcessBuildAndTestStage
  extends BuildAndTestProcessStage {
  requester?: string;
  scenarioExecutionGroup: string | null;
  technicalReseedExecutionGroupId: string | null;
  readyForBuildAndTest: boolean;
  cherryPickRunning: boolean;
  cherryPickFailed: boolean;
}

export const BUILD_AND_TEST_STAGE_ID = "BUILD_AND_TEST";
