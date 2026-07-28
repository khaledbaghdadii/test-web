import { Environment } from "@mxevolve/domains/environment/data-access";

export interface ReferenceScenario {
  scenarioExecutionId: string;
  tpkName: string;
  scenarioStatus: string;
  scenarioStartDate?: string;
  scenarioEndDate?: string;
  tpkCommitId?: string;
  tpkMxVersion?: string;
  tpkMxBuildId?: string;
  environment?: Environment;
}
