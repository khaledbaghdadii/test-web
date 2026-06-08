import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

export interface ScenarioRunTableViewModel {
  id: string;
  name: string;
  status: ScenarioRunStatus;
  environmentStatus: EnvironmentStatus;
  startDate: string;
  endDate?: string;
  commitId: string;
  mxVersion: string;
  mxBuildId: string;
  assigneeId: string;
  assigneeDisplayName: string;
  assigneeEmail: string;
}
