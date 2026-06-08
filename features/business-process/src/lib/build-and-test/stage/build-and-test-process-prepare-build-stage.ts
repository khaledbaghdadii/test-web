import { BuildAndTestProcessStage } from "./build-and-test-process-stage";

export interface BuildAndTestProcessPrepareBuildStage
  extends BuildAndTestProcessStage {
  requester: string;
  latestScenarioExecutionId?: string;
}
