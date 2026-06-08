import { ScenarioRunStatus } from "@mxevolve/domains/test/model";

export interface MultiSelectScenarioRunViewModel {
  id: string;
  name: string;
  status: ScenarioRunStatus;
}
