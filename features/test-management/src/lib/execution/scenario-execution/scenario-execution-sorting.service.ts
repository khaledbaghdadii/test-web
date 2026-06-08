import { Injectable } from "@angular/core";
import { ScenarioExecution } from "./scenario-execution";

@Injectable()
export class ScenarioExecutionSortingService {
  sortByStartDate(
    scenarioExecutions: ScenarioExecution[]
  ): ScenarioExecution[] {
    return scenarioExecutions.sort((scenarioExecution1, scenarioExecution2) => {
      return (
        new Date(scenarioExecution2.startDate).getTime() -
        new Date(scenarioExecution1.startDate).getTime()
      );
    });
  }
}
