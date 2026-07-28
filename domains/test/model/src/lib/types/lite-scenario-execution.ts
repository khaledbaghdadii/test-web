import { ScenarioExecutionHousekeepingStatus } from "./scenario-execution-housekeeping-status";

export interface LiteScenarioExecution {
  id: string;
  cleaningStatus: ScenarioExecutionHousekeepingStatus;
  isFinished: boolean;
}
