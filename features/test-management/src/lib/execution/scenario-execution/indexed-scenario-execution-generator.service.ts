import { Injectable, inject } from "@angular/core";
import { ScenarioExecution } from "./scenario-execution";
import { ScenarioExecutionSortingService } from "./scenario-execution-sorting.service";
import { IndexedScenarioExecution } from "./indexed-scenario-execution";

@Injectable()
export class IndexedScenarioExecutionGeneratorService {
  private scenarioExecutionSortingService = inject(
    ScenarioExecutionSortingService
  );

  public generate(
    scenarioExecutions: ScenarioExecution[]
  ): IndexedScenarioExecution[] {
    return this.scenarioExecutionSortingService
      .sortByStartDate(scenarioExecutions)
      .map((execution, index, executions) => {
        return { ...execution, index: executions.length - index };
      });
  }
}
